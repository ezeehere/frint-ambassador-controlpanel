import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import CampaignFormBuilder from './CampaignFormBuilder'
import { supabase } from '../../lib/supabase'

const actionModes = [
    ['internal_form', 'Internal form'],
    ['external_link', 'External link'],
    ['hybrid', 'Form + external link'],
    ['tracking_only', 'Tracking only'],
]

const formTypes = [
    ['basic_student_form', 'Basic student form'],
    ['internship_form', 'Internship form'],
    ['event_form', 'Event form'],
    ['feedback_form', 'Feedback form'],
    ['ambassador_application_form', 'Ambassador application'],
    ['custom_form', 'Custom form'],
    ['none', 'No form'],
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

function FieldHint({ title, children }) {
    return (
        <div>
            <p className="mb-1.5 text-sm font-semibold text-[var(--frint-text)]">
                {title}
            </p>
            {children}
        </div>
    )
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
        <section className="frint-card rounded-[24px] p-4 sm:p-5">
            <div>
                <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                    Edit campaign
                </h2>
                <p className="mt-0.5 text-sm frint-muted">
                    Change the public form, target, dates, and campaign status inputs.
                </p>
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

            <form onSubmit={saveCampaign} className="mt-5 space-y-4">
                <div className="rounded-[20px] border frint-border bg-[var(--frint-soft-card)] p-3">
                    <p className="mb-3 text-sm font-semibold text-[var(--frint-text)]">
                        Basic info
                    </p>

                    <div className="grid gap-3">
                        <FieldHint title="Campaign title">
                            <input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="frint-input"
                                placeholder="Example: Summer Internship Drive 2026"
                                required
                            />
                        </FieldHint>

                        <FieldHint title="Short note">
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="frint-input min-h-20 resize-y"
                                placeholder="Shown to ambassadors and students"
                            />
                        </FieldHint>
                    </div>
                </div>

                <div className="rounded-[20px] border frint-border bg-[var(--frint-soft-card)] p-3">
                    <p className="mb-3 text-sm font-semibold text-[var(--frint-text)]">
                        Submission setup
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <FieldHint title="Student submission">
                            <select
                                value={form.action_mode}
                                onChange={(e) => setForm({ ...form, action_mode: e.target.value })}
                                className="frint-input"
                            >
                                {actionModes.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </FieldHint>

                        <FieldHint title="Form type">
                            <select
                                value={form.form_type}
                                onChange={(e) => setForm({ ...form, form_type: e.target.value })}
                                className="frint-input"
                            >
                                {formTypes.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </FieldHint>

                        <FieldHint title="Target leads">
                            <input
                                type="number"
                                min="0"
                                value={form.target_count}
                                onChange={(e) => setForm({ ...form, target_count: e.target.value })}
                                className="frint-input"
                                placeholder="100"
                            />
                        </FieldHint>

                        <FieldHint title="Priority">
                            <select
                                value={form.priority}
                                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                className="frint-input"
                            >
                                {priorities.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label} priority
                                    </option>
                                ))}
                            </select>
                        </FieldHint>
                    </div>

                    {['external_link', 'hybrid'].includes(form.action_mode) && (
                        <div className="mt-3">
                            <FieldHint title="External URL">
                                <input
                                    value={form.external_url}
                                    onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                                    className="frint-input"
                                    placeholder="Google Form, website link, or registration URL"
                                />
                            </FieldHint>
                        </div>
                    )}
                </div>

                <div className="rounded-[20px] border frint-border bg-[var(--frint-soft-card)] p-3">
                    <p className="mb-3 text-sm font-semibold text-[var(--frint-text)]">
                        Dates
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <FieldHint title="Start date">
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                className="frint-input"
                            />
                        </FieldHint>

                        <FieldHint title="End date">
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                className="frint-input"
                            />
                        </FieldHint>
                    </div>
                </div>

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
                    className="frint-primary-btn flex w-full items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60 sm:w-fit"
                >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save campaign'}
                </button>
            </form>
        </section>
    )
}
