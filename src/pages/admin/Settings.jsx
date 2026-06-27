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

function Field({ label, hint, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[var(--frint-text)]">
                {label}
            </span>
            {children}
            {hint && <span className="mt-1.5 block text-xs frint-muted">{hint}</span>}
        </label>
    )
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
                default_points_per_proof: result.data.default_points_per_proof || 5,
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
            subtitle="Panel defaults and public form controls"
        >
            <section className="frint-card rounded-[24px] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="frint-icon-chip">
                            <SettingsIcon size={19} />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                                Admin settings
                            </h2>
                            <p className="text-sm frint-muted">
                                Branding, support, points, and public form notice
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={loadSettings}
                        className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                    >
                        <RefreshCw size={15} />
                        Refresh
                    </button>
                </div>

                {message && (
                    <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {message}
                    </div>
                )}

                {success && (
                    <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {success}
                    </div>
                )}

                {loading ? (
                    <div className="mt-5 rounded-[20px] border frint-border p-6 text-center text-sm font-medium frint-muted">
                        Loading settings...
                    </div>
                ) : (
                    <form onSubmit={saveSettings} className="mt-5 space-y-4">
                        <div className="rounded-[20px] border frint-border bg-[var(--frint-soft-card)] p-3">
                            <p className="mb-3 text-sm font-semibold text-[var(--frint-text)]">
                                Public identity
                            </p>

                            <div className="grid gap-3 lg:grid-cols-2">
                                <Field label="App name" hint="Shown inside internal admin screens.">
                                    <input
                                        value={form.app_name}
                                        onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                                        className="frint-input"
                                        placeholder="Frint Ambassador Control Panel"
                                        required
                                    />
                                </Field>

                                <Field label="Support email" hint="Shown if public forms are paused.">
                                    <input
                                        type="email"
                                        value={form.support_email}
                                        onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                                        className="frint-input"
                                        placeholder="support@frint.in"
                                    />
                                </Field>

                                <Field label="Support phone" hint="Internal reference for admins.">
                                    <input
                                        value={form.support_phone}
                                        onChange={(e) => setForm({ ...form, support_phone: e.target.value })}
                                        className="frint-input"
                                        placeholder="Phone number"
                                    />
                                </Field>

                                <Field label="WhatsApp support" hint="Shown to students when needed.">
                                    <input
                                        value={form.support_whatsapp}
                                        onChange={(e) => setForm({ ...form, support_whatsapp: e.target.value })}
                                        className="frint-input"
                                        placeholder="WhatsApp number or link"
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="rounded-[20px] border frint-border bg-[var(--frint-soft-card)] p-3">
                            <p className="mb-3 text-sm font-semibold text-[var(--frint-text)]">
                                Points defaults
                            </p>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Default points per lead">
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.default_points_per_lead}
                                        onChange={(e) =>
                                            setForm({ ...form, default_points_per_lead: e.target.value })
                                        }
                                        className="frint-input"
                                    />
                                </Field>

                                <Field label="Default points per proof">
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.default_points_per_proof}
                                        onChange={(e) =>
                                            setForm({ ...form, default_points_per_proof: e.target.value })
                                        }
                                        className="frint-input"
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="rounded-[20px] border frint-border bg-[var(--frint-soft-card)] p-3">
                            <Field label="Public form notice" hint="Shown on every referral form before the student submits.">
                                <textarea
                                    value={form.public_form_notice}
                                    onChange={(e) =>
                                        setForm({ ...form, public_form_notice: e.target.value })
                                    }
                                    className="frint-input min-h-24 resize-y"
                                    placeholder="Submit your details carefully. Frint team may contact you for verification."
                                />
                            </Field>

                            <label className="mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-[var(--frint-card)] px-3 py-3">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--frint-text)]">
                                        Maintenance mode
                                    </p>
                                    <p className="mt-0.5 text-xs frint-muted">
                                        Pause all public referral forms temporarily.
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
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="frint-primary-btn flex w-full items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60 sm:w-fit"
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save settings'}
                        </button>
                    </form>
                )}
            </section>
        </DashboardLayout>
    )
}
