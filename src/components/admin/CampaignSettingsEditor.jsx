import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import CampaignFormBuilder from './CampaignFormBuilder'
import { supabase } from '../../lib/supabase'

const actionModes = [
    ['internal_form', 'Internal Form'],
    ['external_link', 'External Link'],
    ['hybrid', 'Hybrid'],
    ['tracking_only', 'Tracking Only'],
]

const formTypes = [
    ['basic_student_form', 'Basic Student Form'],
    ['internship_form', 'Internship Form'],
    ['event_form', 'Event Form'],
    ['feedback_form', 'Feedback Form'],
    ['ambassador_application_form', 'Ambassador Application Form'],
    ['custom_form', 'Custom Form'],
    ['none', 'No Form'],
]

const priorities = [
    ['low', 'Low'],
    ['medium', 'Medium'],
    ['high', 'High'],
    ['urgent', 'Urgent'],
]

function normalizeExternalUrl(url) {
    if (!url) return null

    const cleanedUrl = url.trim()
    if (!cleanedUrl) return null

    if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
        return cleanedUrl
    }

    return `https://${cleanedUrl}`
}

export default function CampaignSettingsEditor({ campaign, onUpdated }) {
    const [form, setForm] = useState({
        title: '',
        description: '',
        target_count: 0,
        action_mode: 'internal_form',
        form_type: 'basic_student_form',
        form_schema: [],
        external_url: '',
        start_date: '',
        end_date: '',
        priority: 'medium',
    })

    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        if (!campaign) return

        setForm({
            title: campaign.title || '',
            description: campaign.description || '',
            target_count: campaign.target_count || 0,
            action_mode: campaign.action_mode || 'internal_form',
            form_type: campaign.form_type || 'basic_student_form',
            form_schema: Array.isArray(campaign.form_schema) ? campaign.form_schema : [],
            external_url: campaign.external_url || campaign.target_url || '',
            start_date: campaign.start_date || '',
            end_date: campaign.end_date || '',
            priority: campaign.priority || 'medium',
        })
    }, [campaign])

    const saveCampaign = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')
        setSuccess('')

        const normalizedExternalUrl = normalizeExternalUrl(form.external_url)

        if (!form.title.trim()) {
            setMessage('Campaign title is required.')
            setSaving(false)
            return
        }

        if (
            ['external_link', 'hybrid'].includes(form.action_mode) &&
            !normalizedExternalUrl
        ) {
            setMessage('External URL is required for external and hybrid campaigns.')
            setSaving(false)
            return
        }

        const result = await supabase
            .from('campaigns')
            .update({
                title: form.title.trim(),
                description: form.description.trim() || null,
                target_count: Number(form.target_count) || 0,
                action_mode: form.action_mode,
                form_type: form.form_type,
                form_schema: form.form_type === 'custom_form' ? form.form_schema : [],
                external_url: normalizedExternalUrl,
                target_url: normalizedExternalUrl,
                start_date: form.start_date || null,
                end_date: form.end_date || null,
                priority: form.priority,
                updated_at: new Date().toISOString(),
            })
            .eq('id', campaign.id)

        if (result.error) {
            setMessage(result.error.message)
            setSaving(false)
            return
        }

        setSuccess('Campaign settings updated.')

        if (onUpdated) {
            await onUpdated()
        }

        setSaving(false)
    }

    return (
        <section className="frint-card rounded-[30px] p-6">
            <h2 className="text-xl font-black text-[var(--frint-text)]">
                Campaign settings
            </h2>

            <p className="mt-1 text-sm frint-muted">
                Edit campaign details, form type, URL, and targets
            </p>

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

            <form onSubmit={saveCampaign} className="mt-6 space-y-4">
                <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Campaign title"
                    required
                />

                <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="min-h-24 w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Description"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <select
                        value={form.action_mode}
                        onChange={(e) => setForm({ ...form, action_mode: e.target.value })}
                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    >
                        {actionModes.map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={form.form_type}
                        onChange={(e) => setForm({ ...form, form_type: e.target.value })}
                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    >
                        {formTypes.map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        min="0"
                        value={form.target_count}
                        onChange={(e) => setForm({ ...form, target_count: e.target.value })}
                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                        placeholder="Campaign target"
                    />

                    <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    >
                        {priorities.map(([value, label]) => (
                            <option key={value} value={value}>
                                {label} priority
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    />

                    <input
                        type="date"
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    />
                </div>

                <input
                    value={form.external_url}
                    onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    placeholder="External URL for external/hybrid campaigns"
                />

                {form.form_type === 'custom_form' && (
                    <CampaignFormBuilder
                        value={form.form_schema}
                        onChange={(schema) =>
                            setForm({
                                ...form,
                                form_schema: schema,
                            })
                        }
                    />
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="frint-primary-btn flex items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60"
                >
                    <Save size={17} />
                    {saving ? 'Saving...' : 'Save campaign settings'}
                </button>
            </form>
        </section>
    )
}