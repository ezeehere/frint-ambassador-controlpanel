import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, CheckCircle2, Lock, Mail, ShieldCheck, UsersRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    window.location.reload()
  }

  return (
    <main className="frint-page relative min-h-screen overflow-hidden px-4 py-3 sm:py-4">
      <div className="pointer-events-none absolute left-[-180px] top-[-180px] h-[360px] w-[360px] rounded-full bg-[var(--frint-accent)]/18 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-200px] right-[-180px] h-[420px] w-[420px] rounded-full bg-[#0060f8]/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-3 py-2">
          <img src="/logo.svg" alt="Frint" className="h-10 w-auto object-contain sm:h-11" />
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center py-2">
          <section className="grid w-full overflow-hidden rounded-[28px] border frint-border bg-[var(--frint-card)] shadow-sm lg:h-[min(680px,calc(100vh-92px))] lg:grid-cols-[0.92fr_1.08fr]">
            <aside className="hidden min-h-0 overflow-hidden border-r frint-border bg-[var(--frint-soft-card)] p-6 lg:block">
              <div className="flex h-full flex-col justify-between gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border frint-border bg-[var(--frint-card)] px-3 py-1.5 text-xs font-semibold text-[var(--frint-accent)]">
                    <ShieldCheck size={14} />
                    Secure workspace
                  </div>

                  <h1 className="mt-6 max-w-sm text-[38px] font-semibold leading-[1.05] tracking-[-0.065em] text-[var(--frint-text)]">
                    Keep campus work under control.
                  </h1>

                  <p className="mt-4 max-w-sm text-sm leading-6 frint-muted">
                    Manage campaigns, ambassadors, referral links, leads, tasks, proofs, and reports from one clean panel.
                  </p>
                </div>

                <div className="grid gap-3">
                  <PreviewCard
                    icon={UsersRound}
                    label="Ambassadors"
                    value="24"
                    note="Active across colleges"
                  />
                  <PreviewCard
                    icon={BarChart3}
                    label="Leads tracked"
                    value="1,280"
                    note="Campaign submissions"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {['Campaigns', 'Tasks', 'Reports'].map((item) => (
                    <div key={item} className="rounded-[18px] border frint-border bg-[var(--frint-card)] p-3">
                      <CheckCircle2 size={15} className="text-[var(--frint-accent)]" />
                      <p className="mt-3 truncate text-sm font-semibold text-[var(--frint-text)]">{item}</p>
                      <p className="mt-1 truncate text-xs frint-muted">Ready</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section className="flex min-h-0 items-center justify-center p-5 sm:p-7 lg:p-8">
              <div className="w-full max-w-[430px]">
                <div className="mb-6 lg:hidden">
                  <div className="rounded-[22px] border frint-border bg-[var(--frint-soft-card)] p-4">
                    <p className="text-sm font-semibold text-[var(--frint-text)]">Ambassador Control Panel</p>
                    <p className="mt-1 text-xs leading-5 frint-muted">Campaigns, referrals, leads, tasks, proofs, and reports.</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.06em] text-[var(--frint-text)] sm:text-[34px]">
                    Welcome back
                  </h2>
                  <p className="mt-2 text-sm leading-6 frint-muted">
                    Sign in to continue to the ambassador panel.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="mt-7 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--frint-text)]">Email address</span>
                    <div className="flex items-center gap-3 rounded-[18px] border frint-border bg-[var(--frint-input)] px-4 py-3">
                      <Mail size={17} className="shrink-0 frint-muted" />
                      <input
                        type="email"
                        className="w-full bg-transparent text-sm font-medium text-[var(--frint-text)] outline-none placeholder:frint-muted"
                        placeholder="admin@frint.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--frint-text)]">Password</span>
                    <div className="flex items-center gap-3 rounded-[18px] border frint-border bg-[var(--frint-input)] px-4 py-3">
                      <Lock size={17} className="shrink-0 frint-muted" />
                      <input
                        type="password"
                        className="w-full bg-transparent text-sm font-medium text-[var(--frint-text)] outline-none placeholder:frint-muted"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </label>

                  {error && (
                    <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="frint-primary-btn flex w-full items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-70"
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </form>

                <div className="mt-5 rounded-[22px] border frint-border bg-[var(--frint-soft-card)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--frint-card)] text-[var(--frint-accent)]">
                      <ShieldCheck size={17} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--frint-text)]">Need ambassador access?</p>
                      <p className="mt-1 text-xs leading-5 frint-muted">Submit a request. Admin will verify and create your login.</p>
                      <Link to="/request-access" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--frint-accent)]">
                        Request access
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-center text-xs frint-muted">
                  Approved Frint admins and campus ambassadors only.
                </p>
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  )
}

function PreviewCard({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-[22px] border frint-border bg-[var(--frint-card)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold frint-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--frint-text)]">{value}</p>
          <p className="mt-1 text-xs frint-muted">{note}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--frint-soft-card)] text-[var(--frint-accent)]">
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}
