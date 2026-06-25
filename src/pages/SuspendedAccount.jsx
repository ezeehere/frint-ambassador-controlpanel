import { LogOut, ShieldAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SuspendedAccount() {
  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="frint-page flex min-h-screen items-center justify-center p-4">
      <section className="frint-card w-full max-w-md rounded-[32px] p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldAlert size={27} />
        </div>

        <h1 className="mt-5 text-2xl font-black text-[var(--frint-text)]">
          Account suspended
        </h1>

        <p className="mt-3 text-sm font-bold leading-6 frint-muted">
          Your ambassador account is not active right now. Please contact the Frint admin team.
        </p>

        <button
          onClick={logout}
          className="frint-primary-btn mt-6 flex w-full items-center justify-center gap-2 px-5 py-3 text-sm"
        >
          <LogOut size={16} />
          Logout
        </button>
      </section>
    </div>
  )
}
