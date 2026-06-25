import { useCallback, useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import { ThemeProvider } from './context/ThemeContext'
import { supabase } from './lib/supabase'

import IntroScreen from './components/IntroScreen'
import Login from './pages/Login'
import PlaceholderPage from './pages/PlaceholderPage'
import SuspendedAccount from './pages/SuspendedAccount'

import AdminDashboard from './pages/admin/AdminDashboard'
import Ambassadors from './pages/admin/Ambassadors'
import Colleges from './pages/admin/Colleges'
import Campaigns from './pages/admin/Campaigns'
import CampaignDetails from './pages/admin/CampaignDetails'
import Leads from './pages/admin/Leads'
import Tasks from './pages/admin/Tasks'
import Proofs from './pages/admin/Proofs'
import Reports from './pages/admin/Reports'
import Settings from './pages/admin/Settings'

import AmbassadorDashboard from './pages/ambassador/AmbassadorDashboard'
import MyCampaigns from './pages/ambassador/MyCampaigns'
import MyLeads from './pages/ambassador/MyLeads'
import MyTasks from './pages/ambassador/MyTasks'

import Leaderboard from './pages/Leaderboard'
import CampaignLeadPage from './pages/public/CampaignLeadPage'
import ThankYou from './pages/public/ThankYou'

function getIntroKey(pathname) {
  if (pathname.startsWith('/c/')) {
    return `frint_public_form_intro_${pathname}`
  }

  return 'frint_intro_seen'
}

function isPublicPath(pathname) {
  return pathname.startsWith('/c/') || pathname.startsWith('/thank-you')
}

function getRoleHome(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'ambassador') return '/ambassador/dashboard'

  return '/login'
}

function LoadingScreen() {
  return (
    <div className="frint-page flex min-h-screen items-center justify-center px-4">
      <div className="frint-card rounded-3xl px-8 py-6 text-center">
        <img src="/logo.svg" alt="Frint" className="mx-auto h-12" />
        <p className="mt-4 text-sm font-semibold frint-muted">
          Preparing your panel...
        </p>
      </div>
    </div>
  )
}

function AccountNotAssigned() {
  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="frint-page flex min-h-screen items-center justify-center px-4">
      <div className="frint-card max-w-md rounded-3xl p-8 text-center">
        <img src="/logo.svg" alt="Frint" className="mx-auto h-12" />

        <h1 className="mt-6 text-2xl font-black text-[var(--frint-text)]">
          Account not assigned
        </h1>

        <p className="mt-3 text-sm font-bold leading-6 frint-muted">
          Your login exists, but no role is assigned yet. Ask an admin to assign
          your account as admin or ambassador.
        </p>

        <button
          onClick={logout}
          className="frint-primary-btn mt-6 w-full px-5 py-3 text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

function ProtectedRoute({ allowedRole, role, session, children }) {
  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (role !== allowedRole) {
    return <Navigate to={getRoleHome(role)} replace />
  }

  return children
}

function AppGate() {
  const location = useLocation()
  const pathname = location.pathname

  const publicPage = isPublicPath(pathname)
  const publicReferralRoute = pathname.startsWith('/c/')
  const introKey = getIntroKey(pathname)

  const [introDone, setIntroDone] = useState(() => {
    return sessionStorage.getItem(getIntroKey(window.location.pathname)) === 'yes'
  })

  const [authLoading, setAuthLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

  const finishIntro = useCallback(() => {
    sessionStorage.setItem(introKey, 'yes')
    setIntroDone(true)
  }, [introKey])

  const loadUserData = async (currentSession) => {
    setSession(currentSession)

    if (!currentSession?.user) {
      setProfile(null)
      setAuthLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status')
      .eq('id', currentSession.user.id)
      .maybeSingle()

    if (error) {
      console.error('Profile loading error:', error.message)
    }

    setProfile(data || null)
    setAuthLoading(false)
  }

  useEffect(() => {
    setIntroDone(sessionStorage.getItem(introKey) === 'yes')
  }, [introKey])

  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      setAuthLoading(true)

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (!isMounted) return

      await loadUserData(currentSession)
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return

      setAuthLoading(true)
      loadUserData(currentSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (!introDone) {
    return (
      <IntroScreen
        onFinish={finishIntro}
        title={publicReferralRoute ? 'Welcome to Frint' : 'Ambassador Control Panel'}
        subtitle={publicReferralRoute ? 'Loading your form' : 'Loading your workspace'}
        footerText={publicReferralRoute ? 'Preparing your form' : 'Preparing your panel'}
      />
    )
  }

  if (authLoading) {
    return <LoadingScreen />
  }

  const role = profile?.role
  const isSuspended = session && profile && profile.status !== 'active'

  if (isSuspended && !publicPage) {
    return <SuspendedAccount />
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/c/:refCode" element={<CampaignLeadPage />} />
      <Route path="/thank-you" element={<ThankYou />} />

      {/* Auth */}
      <Route
        path="/login"
        element={
          !session ? (
            <Login />
          ) : (
            <Navigate to={getRoleHome(role)} replace />
          )
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="admin" role={role} session={session}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/ambassadors"
        element={
          <ProtectedRoute allowedRole="admin" role={role} session={session}>
            <Ambassadors />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/colleges"
        element={
          <ProtectedRoute allowedRole="admin" role={role} session={session}>
            <Colleges />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/campaigns"
        element={
          <ProtectedRoute allowedRole="admin" role={role} session={session}>
            <Campaigns />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/campaigns/:id"
        element={
          <ProtectedRoute allowedRole="admin" role={role} session={session}>
            <CampaignDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/leads"
        element={
          <ProtectedRoute allowedRole="admin" role={role} session={session}>
            <Leads />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tasks"
        element={
          <ProtectedRoute allowedRole="admin" role={role} session={session}>
            <Tasks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/proofs"
        element={
          <ProtectedRoute allowedRole="admin" role={role} session={session}>
            <Proofs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/leaderboard"
        element={
          <ProtectedRoute allowedRole="admin" role={role} session={session}>
            <Leaderboard role="admin" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRole="admin" role={role} session={session}>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRole="admin" role={role} session={session}>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Ambassador routes */}
      <Route
        path="/ambassador/dashboard"
        element={
          <ProtectedRoute allowedRole="ambassador" role={role} session={session}>
            <AmbassadorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ambassador/campaigns"
        element={
          <ProtectedRoute allowedRole="ambassador" role={role} session={session}>
            <MyCampaigns />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ambassador/referrals"
        element={
          <ProtectedRoute allowedRole="ambassador" role={role} session={session}>
            <MyCampaigns />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ambassador/leads"
        element={
          <ProtectedRoute allowedRole="ambassador" role={role} session={session}>
            <MyLeads />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ambassador/tasks"
        element={
          <ProtectedRoute allowedRole="ambassador" role={role} session={session}>
            <MyTasks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ambassador/proofs"
        element={
          <ProtectedRoute allowedRole="ambassador" role={role} session={session}>
            <MyTasks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ambassador/leaderboard"
        element={
          <ProtectedRoute allowedRole="ambassador" role={role} session={session}>
            <Leaderboard role="ambassador" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ambassador/profile"
        element={
          <ProtectedRoute allowedRole="ambassador" role={role} session={session}>
            <PlaceholderPage
              role="ambassador"
              title="Profile"
              subtitle="Manage your ambassador details"
            />
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : role === 'admin' || role === 'ambassador' ? (
            <Navigate to={getRoleHome(role)} replace />
          ) : (
            <AccountNotAssigned />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppGate />
      </BrowserRouter>
    </ThemeProvider>
  )
}