import { useEffect, useState } from 'react'
import { RefreshCw, Save, Settings as SettingsIcon } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { supabase } from '../../lib/supabase'

const initialForm = {
    app_name: '',
    support_email: '',
    support_phone: '',
    support_whatsapp: '',
    default_points_per_lead: 5,
    default_points_per_proof: 10,
    public_form_notice: '',
    maintenance_mode: false,
}

export default function Settings() {
    const [form, setForm] = useState(initialForm)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [success, setSuccess] = useState('')

    const loadSettings = async () => {
        setLoading(true)
        setMessage('')
        setSuccess('')

        const result = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', true)
            .maybeSingle()

        if (result.error) {
            setMessage(result.error.message)
            setLoading(false)
            return
        }

        if (result.data) {
            setForm({
                app_name: result.data.app_name || '',
                support_email: result.data.support_email || '',
                support_phone: result.data.support_phone || '',
                support_whatsapp: result.data.support_whatsapp || '',
                default_points_per_lead: result.data.default_points_per_lead || 5,
                default_points_per_proof: result.data.default_points_per_proof || 10,
                public_form_notice: result.data.public_form_notice || '',
                maintenance_mode: Boolean(result.data.maintenance_mode),
            })
        }

        setLoading(false)
    }

    useEffect(() => {
        loadSettings()
    }, [])

    const saveSettings = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')
        setSuccess('')

        const result = await supabase
            .from('app_settings')
            .update({
                app_name: form.app_name.trim(),
                support_email: form.support_email.trim() || null,
                support_phone: form.support_phone.trim() || null,
                support_whatsapp: form.support_whatsapp.trim() || null,
                default_points_per_lead: Number(form.default_points_per_lead) || 0,
                default_points_per_proof: Number(form.default_points_per_proof) || 0,
                public_form_notice: form.public_form_notice.trim() || null,
                maintenance_mode: form.maintenance_mode,
                updated_at: new Date().toISOString(),
            })
            .eq('id', true)

        if (result.error) {
            setMessage(result.error.message)
            setSaving(false)
            return
        }

        setSuccess('Settings saved successfully.')
        setSaving(false)
    }

    return (
        <DashboardLayout
            role="admin"
            title="Settings"
            subtitle="Control panel defaults and public form settings"
        >
            <section className="frint-card rounded-[30px] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
                            <SettingsIcon size={21} />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                Admin settings
                            </h2>
                            <p className="text-sm frint-muted">
                                Branding, support, points, and form notice
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={loadSettings}
                        className="frint-secondary-btn flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                {message && (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {message}
                    </div>
                )}

                {success && (
                    <div className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                        {success}
                    </div>
                )}

                {loading ? (
                    <div className="mt-6 rounded-[24px] border frint-border p-8 text-center text-sm font-bold frint-muted">
                        Loading settings...
                    </div>
                ) : (
                    <form onSubmit={saveSettings} className="mt-6 space-y-6">
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-black text-[var(--frint-text)]">
                                    App name
                                </label>
                                <input
                                    value={form.app_name}
                                    onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="App name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-black text-[var(--frint-text)]">
                                    Support email
                                </label>
                                <input
                                    type="email"
                                    value={form.support_email}
                                    onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="support@frint.in"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-black text-[var(--frint-text)]">
                                    Support phone
                                </label>
                                <input
                                    value={form.support_phone}
                                    onChange={(e) => setForm({ ...form, support_phone: e.target.value })}
                                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Phone number"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-black text-[var(--frint-text)]">
                                    WhatsApp support
                                </label>
                                <input
                                    value={form.support_whatsapp}
                                    onChange={(e) => setForm({ ...form, support_whatsapp: e.target.value })}
                                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="WhatsApp number"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
                                <label className="mb-2 block text-sm font-black text-[var(--frint-text)]">
                                    Default points per lead
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.default_points_per_lead}
                                    onChange={(e) =>
                                        setForm({ ...form, default_points_per_lead: e.target.value })
                                    }
                                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                />
                            </div>

                            <div className="rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
                                <label className="mb-2 block text-sm font-black text-[var(--frint-text)]">
                                    Default points per proof
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.default_points_per_proof}
                                    onChange={(e) =>
                                        setForm({ ...form, default_points_per_proof: e.target.value })
                                    }
                                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-black text-[var(--frint-text)]">
                                Public form notice
                            </label>
                            <textarea
                                value={form.public_form_notice}
                                onChange={(e) =>
                                    setForm({ ...form, public_form_notice: e.target.value })
                                }
                                className="min-h-28 w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="Notice shown on public referral forms"
                            />
                        </div>

                        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
                            <div>
                                <p className="text-sm font-black text-[var(--frint-text)]">
                                    Maintenance mode
                                </p>
                                <p className="mt-1 text-sm frint-muted">
                                    Keep this off unless Frint wants to pause public activity.
                                </p>
                            </div>

                            <input
                                type="checkbox"
                                checked={form.maintenance_mode}
                                onChange={(e) =>
                                    setForm({ ...form, maintenance_mode: e.target.checked })
                                }
                                className="h-5 w-5"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={saving}
                            className="frint-primary-btn flex items-center justify-center gap-2 px-6 py-3 text-sm disabled:opacity-60"
                        >
                            <Save size={17} />
                            {saving ? 'Saving...' : 'Save settings'}
                        </button>
                    </form>
                )}
            </section>
        </DashboardLayout>
    )
}