import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'
import { supabase } from '../lib/supabase'

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
    <main className="relative min-h-[100svh] overflow-hidden bg-[var(--frint-bg)] px-4 py-4">
      <div className="pointer-events-none absolute left-[-120px] top-[-100px] h-[300px] w-[300px] rounded-full bg-[var(--frint-accent)]/22 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-140px] right-[-120px] h-[320px] w-[320px] rounded-full bg-[#0060f8]/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100svh-32px)] w-full max-w-6xl flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4 py-1">
          <img src="/logo.svg" alt="Frint" className="h-11 w-auto object-contain sm:h-12" />
          <ThemeToggle />
        </header>

        <section className="grid flex-1 items-center gap-5 py-4 lg:grid-cols-[1fr_460px] lg:gap-10 lg:py-0">
          <div className="hidden lg:block">
            <div className="max-w-xl rounded-[34px] border frint-border bg-[var(--frint-card)]/72 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
              <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr]">
                <div className="rounded-[28px] bg-[var(--frint-soft-card)] p-6">
                  <p className="text-sm font-semibold frint-muted">Campaign pulse</p>
                  <h1 className="mt-5 max-w-xs text-[42px] font-semibold leading-[1.02] tracking-[-0.065em] text-[var(--frint-text)]">
                    Work that stays in view.
                  </h1>

                  <div className="mt-8 space-y-4">
                    {[
                      ['Internship drive', '72%'],
                      ['Workshop signups', '48%'],
                      ['Proof review', '86%'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="mb-1.5 flex justify-between text-xs font-semibold frint-muted">
                          <span>{label}</span>
                          <span>{value}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--frint-card)]">
                          <div className="h-full rounded-full bg-[var(--frint-accent)]" style={{ width: value }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  {[
                    ['24', 'Ambassadors'],
                    ['1,280', 'Leads tracked'],
                    ['156', 'Tasks done'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-[26px] border frint-border bg-[var(--frint-soft-card)] p-5">
                      <p className="text-3xl font-semibold tracking-[-0.04em] text-[var(--frint-text)]">{value}</p>
                      <p className="mt-2 text-sm font-medium frint-muted">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-[30px] border frint-border bg-[var(--frint-card)]/88 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-7 lg:mx-0">
            <div className="rounded-[24px] bg-[var(--frint-soft-card)] px-4 py-4">
              <h1 className="text-xl font-semibold tracking-[-0.04em] text-[var(--frint-text)] sm:text-2xl">
                Ambassador Control Panel
              </h1>
              <p className="mt-1.5 text-sm leading-5 frint-muted">
                Campaigns, referrals, leads, tasks, proofs, and reports.
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-[28px] font-semibold leading-none tracking-[-0.06em] text-[var(--frint-text)]">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-5 frint-muted">
                Sign in to continue to the ambassador panel.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--frint-text)]">
                  Email address
                </span>
                <div className="flex items-center gap-3 rounded-[20px] border frint-border bg-[var(--frint-input)] px-4 py-3.5">
                  <Mail size={18} className="shrink-0 frint-muted" />
                  <input
                    type="email"
                    className="w-full bg-transparent text-sm font-medium outline-none"
                    placeholder="admin@frint.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--frint-text)]">
                  Password
                </span>
                <div className="flex items-center gap-3 rounded-[20px] border frint-border bg-[var(--frint-input)] px-4 py-3.5">
                  <Lock size={18} className="shrink-0 frint-muted" />
                  <input
                    type="password"
                    className="w-full bg-transparent text-sm font-medium outline-none"
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
                className="frint-primary-btn flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-70"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            <Link
              to="/request-access"
              className="mt-5 flex items-start gap-3 rounded-[24px] border frint-border bg-[var(--frint-soft-card)] px-4 py-4 transition hover:-translate-y-0.5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--frint-card)] text-[var(--frint-accent)]">
                <ShieldCheck size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--frint-text)]">
                  Need ambassador access?
                </span>
                <span className="mt-1 block text-xs leading-5 frint-muted">
                  Submit a request. Admin will verify and create your login.
                </span>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--frint-text)]">
                  Request access <ArrowRight size={14} />
                </span>
              </span>
            </Link>

            <p className="mt-4 text-center text-xs frint-muted">
              Approved Frint admins and campus ambassadors only.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
