import { useState } from 'react'
import { KeyRound, PauseCircle, PlayCircle } from 'lucide-react'
import { updateAmbassadorAccount } from '../../lib/adminApi'

export default function AmbassadorAccountActions({ ambassador, onUpdated }) {
    const [password, setPassword] = useState('')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [success, setSuccess] = useState('')

    const runAction = async (action) => {
        setSaving(true)
        setMessage('')
        setSuccess('')

        try {
            await updateAmbassadorAccount({
                ambassador_id: ambassador.id,
                action,
                password,
            })

            if (action === 'reset_password') {
                setPassword('')
                setSuccess('Password reset successfully.')
            }

            if (action === 'suspend') {
                setSuccess('Ambassador suspended.')
            }

            if (action === 'activate') {
                setSuccess('Ambassador activated.')
            }

            if (onUpdated) {
                await onUpdated()
            }
        } catch (error) {
            setMessage(error.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="mt-4 rounded-[22px] border frint-border bg-[var(--frint-soft-card)] p-4">
            <p className="text-sm font-black text-[var(--frint-text)]">
                Account controls
            </p>

            {message && (
                <div className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                    {message}
                </div>
            )}

            {success && (
                <div className="mt-3 rounded-2xl bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                    {success}
                </div>
            )}

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    placeholder="New temporary password"
                />

                <button
                    type="button"
                    disabled={saving || password.length < 6}
                    onClick={() => runAction('reset_password')}
                    className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-3 text-sm disabled:opacity-50"
                >
                    <KeyRound size={16} />
                    Reset
                </button>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                {ambassador.status === 'active' ? (
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => runAction('suspend')}
                        className="flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
                    >
                        <PauseCircle size={16} />
                        Suspend account
                    </button>
                ) : (
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => runAction('activate')}
                        className="flex items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
                    >
                        <PlayCircle size={16} />
                        Activate account
                    </button>
                )}
            </div>
        </div>
    )
}