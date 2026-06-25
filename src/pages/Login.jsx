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
    <main className="frint-page px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center">
        <div className="frint-card grid w-full overflow-hidden rounded-[36px] shadow-xl lg:grid-cols-2">
          <section className="hidden bg-[#0b1220] p-10 text-white lg:block">
            <div className="flex h-full flex-col justify-between">
              <div>
                <img src="/logo.svg" alt="Frint" className="h-16 w-auto" />
                <div className="mt-16">
                  <span className="rounded-full bg-[#0060f8]/20 px-4 py-2 text-sm font-semibold text-[#70c0f8]">
                    Ambassador Panel
                  </span>
                  <h1 className="mt-8 text-5xl font-bold leading-tight">
                    Manage campus campaigns with clarity.
                  </h1>
                  <p className="mt-5 max-w-md text-lg text-slate-300">
                    Track ambassadors, referrals, student leads, tasks, proof uploads, and reports from one place.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-300">
                  Built for Frint campus teams, hiring drives, workshops, and student outreach.
                </p>
              </div>
            </div>
          </section>

          <section className="p-8 sm:p-12">
            <div className="mx-auto max-w-md">
              <div className="mb-10 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0060f8] text-white">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    Welcome back
                  </h2>
                  <p className="frint-muted text-sm">
                    Login to Frint Ambassador Control Panel
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    Email
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border frint-border bg-[var(--frint-input)] px-4 py-3">
                    <Mail size={18} className="frint-muted" />
                    <input
                      type="email"
                      className="w-full bg-transparent outline-none"
                      placeholder="admin@frint.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    Password
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border frint-border bg-[var(--frint-input)] px-4 py-3">
                    <Lock size={18} className="frint-muted" />
                    <input
                      type="password"
                      className="w-full bg-transparent outline-none"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </label>

                {error && (
                  <p className="rounded-2xl bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#0060f8] px-5 py-4 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
