import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { supabase } from './lib/supabase'
import IntroScreen from './components/IntroScreen'
import Login from './pages/Login'
import Ambassadors from './pages/admin/Ambassadors'
import Colleges from './pages/admin/Colleges'
import Campaigns from './pages/admin/Campaigns'
import PlaceholderPage from './pages/PlaceholderPage'
import CampaignDetails from './pages/admin/CampaignDetails'
import CampaignLeadPage from './pages/public/CampaignLeadPage'
import ThankYou from './pages/public/ThankYou'
import Leads from './pages/admin/Leads'
import AdminDashboard from './pages/admin/AdminDashboard'
import AmbassadorDashboard from './pages/ambassador/AmbassadorDashboard'
import MyCampaigns from './pages/ambassador/MyCampaigns'
import MyLeads from './pages/ambassador/MyLeads'
import Tasks from './pages/admin/Tasks'
import Proofs from './pages/admin/Proofs'
import MyTasks from './pages/ambassador/MyTasks'
import Leaderboard from './pages/Leaderboard'
import Reports from './pages/admin/Reports'
import SuspendedAccount from './pages/SuspendedAccount'
import Settings from './pages/admin/Settings'

function getIntroKey(pathname) {
  if (pathname.startsWith('/c/')) {
    return `frint_public_form_intro_${pathname}`
  }

  return 'frint_intro_seen'
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f8fc] px-4">
      <div className="rounded-3xl border border-[#dde7f3] bg-white px-8 py-6 text-center shadow-sm">
        <img src="/logo.svg" alt="Frint" className="mx-auto h-12" />
        <p className="mt-4 text-sm font-semibold text-[#64748b]">
          Preparing your panel...
        </p>
      </div>
    </div>
  )
}

function AppGate() {
  const location = useLocation()
  const isPublicReferralRoute = location.pathname.startsWith('/c/')
  const introKey = getIntroKey(location.pathname)

  const [introDone, setIntroDone] = useState(() => {
    return sessionStorage.getItem(getIntroKey(window.location.pathname)) === 'yes'
  })

  useEffect(() => {
    setIntroDone(sessionStorage.getItem(introKey) === 'yes')
  }, [introKey])

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
    let isMounted = true

    const initAuth = async () => {
      setAuthLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) return
      await loadUserData(session)
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
        title={isPublicReferralRoute ? 'Welcome to Frint' : 'Ambassador Control Panel'}
        subtitle={isPublicReferralRoute ? 'Loading your form' : 'Loading your workspace'}
        footerText={isPublicReferralRoute ? 'Preparing your form' : 'Preparing your panel'}
      />
    )
  }

  if (authLoading) {
    return <LoadingScreen />
  }

  const role = profile?.role
  const isAdmin = session && role === 'admin'
  const isAmbassador = session && role === 'ambassador'

  const isPublicPage =
    location.pathname.startsWith('/c/') ||
    location.pathname.startsWith('/thank-you')

  if (session && profile && profile.status !== 'active' && !isPublicPage) {
    return <SuspendedAccount />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!session ? <Login /> : <Navigate to="/" replace />}
      />

      <Route
        path="/admin/ambassadors"
        element={isAdmin ? <Ambassadors /> : <Navigate to="/" replace />}
      />

      <Route
        path="/admin/colleges"
        element={isAdmin ? <Colleges /> : <Navigate to="/" replace />}
      />

      <Route
        path="/admin/campaigns"
        element={isAdmin ? <Campaigns /> : <Navigate to="/" replace />}
      />

      <Route
        path="/admin/campaigns/:id"
        element={isAdmin ? <CampaignDetails /> : <Navigate to="/" replace />}
      />

      <Route
        path="/admin/leads"
        element={isAdmin ? <Leads /> : <Navigate to="/" replace />}
      />
      <Route path="/c/:refCode" element={<CampaignLeadPage />} />
      <Route path="/thank-you" element={<ThankYou />} />

      <Route
        path="/admin/tasks"
        element={isAdmin ? <Tasks /> : <Navigate to="/" replace />}
      />

      <Route
        path="/admin/proofs"
        element={isAdmin ? <Proofs /> : <Navigate to="/" replace />}
      />

      <Route
        path="/admin/leaderboard"
        element={isAdmin ? <Leaderboard role="admin" /> : <Navigate to="/" replace />}
      />

      <Route
        path="/admin/reports"
        element={isAdmin ? <Reports /> : <Navigate to="/" replace />}
      />

      <Route
        path="/admin/settings"
        element={isAdmin ? <Settings /> : <Navigate to="/" replace />}
      />

      <Route
        path="/admin/campaigns"
        element={isAdmin ? <Campaigns /> : <Navigate to="/" replace />}
      />

      <Route
        path="/ambassador/campaigns"
        element={isAmbassador ? <MyCampaigns /> : <Navigate to="/" replace />}
      />

      <Route
        path="/ambassador/referrals"
        element={isAmbassador ? <MyCampaigns /> : <Navigate to="/" replace />}
      />

      <Route
        path="/ambassador/leads"
        element={isAmbassador ? <MyLeads /> : <Navigate to="/" replace />}
      />
      <Route
        path="/ambassador/tasks"
        element={isAmbassador ? <MyTasks /> : <Navigate to="/" replace />}
      />

      <Route
        path="/ambassador/proofs"
        element={isAmbassador ? <MyTasks /> : <Navigate to="/" replace />}
      />

      <Route
        path="/ambassador/leaderboard"
        element={
          isAmbassador ? <Leaderboard role="ambassador" /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/ambassador/profile"
        element={
          isAmbassador ? (
            <PlaceholderPage
              role="ambassador"
              title="Profile"
              subtitle="Manage your ambassador details"
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/admin/dashboard"
        element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />}
      />

      <Route
        path="/ambassador/dashboard"
        element={
          isAmbassador ? <AmbassadorDashboard /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : isAdmin ? (
            <Navigate to="/admin/dashboard" replace />
          ) : isAmbassador ? (
            <Navigate to="/ambassador/dashboard" replace />
          ) : (
            <div className="flex min-h-screen items-center justify-center bg-[#f5f8fc] px-4">
              <div className="max-w-md rounded-3xl border border-[#dde7f3] bg-white p-8 text-center shadow-sm">
                <img src="/logo.svg" alt="Frint" className="mx-auto h-12" />
                <h1 className="mt-6 text-2xl font-bold text-[#0b1220]">
                  Account not assigned
                </h1>
                <p className="mt-3 text-[#64748b]">
                  Your login exists, but no role is assigned yet. Add this user in the profiles table with role admin or ambassador.
                </p>
              </div>
            </div>
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