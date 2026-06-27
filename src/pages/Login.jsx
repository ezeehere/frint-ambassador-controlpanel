import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { GraduationCap, Lock, Mail } from 'lucide-react'

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
    <main className="frint-page min-h-screen px-4 py-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-5xl items-center justify-center">
        <section className="frint-card grid w-full overflow-hidden rounded-[30px] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden bg-[#101010] p-8 text-white lg:block">
            <div className="flex h-full min-h-[540px] flex-col justify-between">
              <div>
                <img src="/logo.svg" alt="Frint" className="h-12 w-auto" />

                <div className="mt-16">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#70c0f8]">
                    Ambassador Panel
                  </span>

                  <h1 className="mt-6 max-w-sm text-[42px] font-semibold leading-[1.05] tracking-[-0.06em]">
                    Run campus campaigns with clarity.
                  </h1>

                  <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/65">
                    Track ambassadors, referral links, student leads, tasks, proof uploads, and reports from one clean workspace.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/55">Campaigns</span>
                  <span className="font-semibold text-white">Live tracking</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/55">Ambassadors</span>
                  <span className="font-semibold text-white">Role based</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/55">Reports</span>
                  <span className="font-semibold text-white">Export ready</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-md">
              <div className="lg:hidden">
                <img src="/logo.svg" alt="Frint" className="h-10 w-auto" />
              </div>

              <div className="mt-8 flex items-start gap-3 lg:mt-0">
                <div className="frint-icon-chip shrink-0">
                  <GraduationCap size={21} />
                </div>

                <div>
                  <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.05em] text-[var(--frint-text)]">
                    Welcome back
                  </h2>
                  <p className="mt-1 text-sm frint-muted">
                    Login to the Frint Ambassador Control Panel
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--frint-text)]">
                    Email
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border frint-border bg-[var(--frint-input)] px-4 py-3">
                    <Mail size={17} className="frint-muted" />
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
                  <div className="flex items-center gap-3 rounded-2xl border frint-border bg-[var(--frint-input)] px-4 py-3">
                    <Lock size={17} className="frint-muted" />
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
                  className="frint-primary-btn flex w-full items-center justify-center px-5 py-3 text-sm disabled:opacity-70"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <p className="mt-6 text-center text-xs frint-muted">
                For Frint admins and campus ambassadors only.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
