import { useEffect, useMemo, useState } from 'react'
import {
    Link2,
    Megaphone,
    Plus,
    RefreshCw,
    Search,
    Target,
    Users,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'
import CampaignFormBuilder from '../../components/admin/CampaignFormBuilder'
import { Link } from 'react-router-dom'

const initialForm = {
    title: '',
    description: '',
    type: 'internship_drive',
    goal_type: 'lead_collection',
    target_count: 100,
    primary_action: 'collect_leads',
    action_mode: 'internal_form',
    audience_type: 'students',
    form_type: 'basic_student_form',
    form_schema: [],
    external_url: '',
    start_date: '',
    end_date: '',
    status: 'active',
    priority: 'medium',
    requires_proof: false,
    points_per_lead: 5,
    points_per_conversion: 20,
    points_per_proof: 10,
    assignment_target_count: 50,
    assignment_deadline: '',
}

const campaignTypes = [
    ['internship_drive', 'Internship Drive'],
    ['hiring_drive', 'Hiring Drive'],
    ['event_registration', 'Event Registration'],
    ['workshop', 'Workshop'],
    ['survey', 'Survey'],
    ['link_delivery', 'Link Delivery'],
    ['campus_ambassador_recruitment', 'Campus Ambassador Recruitment'],
    ['competition', 'Competition'],
    ['feedback_collection', 'Feedback Collection'],
    ['company_outreach', 'Company Outreach'],
    ['startup_program', 'Startup Program'],
    ['general', 'General'],
]

const actionModes = [
    ['internal_form', 'Internal Form'],
    ['external_link', 'External Link'],
    ['hybrid', 'Hybrid'],
    ['tracking_only', 'Tracking Only'],
]

const primaryActions = [
    ['collect_leads', 'Collect Leads'],
    ['collect_registrations', 'Collect Registrations'],
    ['collect_applications', 'Collect Applications'],
    ['send_link', 'Send Link'],
    ['confirm_attendance', 'Confirm Attendance'],
    ['collect_feedback', 'Collect Feedback'],
    ['upload_proof', 'Upload Proof'],
    ['company_followup', 'Company Follow-up'],
]

const audienceTypes = [
    ['students', 'Students'],
    ['ambassadors', 'Ambassadors'],
    ['companies', 'Companies'],
    ['colleges', 'Colleges'],
    ['past_users', 'Past Users'],
    ['mixed', 'Mixed'],
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

    if (
        cleanedUrl.startsWith('http://') ||
        cleanedUrl.startsWith('https://')
    ) {
        return cleanedUrl
    }

    return `https://${cleanedUrl}`
}

function slugify(text = '') {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
}

function shortCode() {
    return Math.random().toString(36).slice(2, 7)
}

function getLabel(options, value) {
    return options.find((item) => item[0] === value)?.[1] || value || 'Not set'
}

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([])
    const [progressRows, setProgressRows] = useState([])
    const [ambassadors, setAmbassadors] = useState([])
    const [assignments, setAssignments] = useState([])
    const [selectedAmbassadors, setSelectedAmbassadors] = useState([])
    const [form, setForm] = useState(initialForm)
    const [search, setSearch] = useState('')
    const [assignmentDrafts, setAssignmentDrafts] = useState({})
    const [assigningCampaignId, setAssigningCampaignId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    const loadData = async () => {
        setLoading(true)
        setMessage('')

        const campaignResult = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false })

        const progressResult = await supabase
            .from('campaign_progress')
            .select('*')

        const ambassadorResult = await supabase
            .from('profiles')
            .select(`
        id,
        full_name,
        email,
        role,
        status,
        college_id,
        colleges (
          id,
          name,
          city
        )
      `)
            .eq('role', 'ambassador')
            .eq('status', 'active')
            .order('full_name', { ascending: true })

        const assignmentResult = await supabase
            .from('ambassador_campaigns')
            .select('*')
            .order('assigned_at', { ascending: false })

        if (campaignResult.error) setMessage(campaignResult.error.message)
        if (progressResult.error) setMessage(progressResult.error.message)
        if (ambassadorResult.error) setMessage(ambassadorResult.error.message)
        if (assignmentResult.error) setMessage(assignmentResult.error.message)

        setCampaigns(campaignResult.data || [])
        setProgressRows(progressResult.data || [])
        setAmbassadors(ambassadorResult.data || [])
        setAssignments(assignmentResult.data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredCampaigns = useMemo(() => {
        const value = search.trim().toLowerCase()

        if (!value) return campaigns

        return campaigns.filter((campaign) => {
            return (
                campaign.title?.toLowerCase().includes(value) ||
                campaign.type?.toLowerCase().includes(value) ||
                campaign.status?.toLowerCase().includes(value) ||
                campaign.action_mode?.toLowerCase().includes(value)
            )
        })
    }, [campaigns, search])

    const getCampaignProgress = (campaignId) => {
        return progressRows.find((item) => item.campaign_id === campaignId)
    }

    const getCampaignAssignments = (campaignId) => {
        return assignments.filter((item) => item.campaign_id === campaignId)
    }

    const getAmbassadorById = (id) => {
        return ambassadors.find((item) => item.id === id)
    }

    const getUnassignedAmbassadors = (campaignId) => {
        const campaignAssignments = getCampaignAssignments(campaignId)
        const assignedIds = campaignAssignments.map((item) => item.ambassador_id)

        return ambassadors.filter((ambassador) => !assignedIds.includes(ambassador.id))
    }

    const updateAssignmentDraft = (campaignId, patch) => {
        setAssignmentDrafts((current) => ({
            ...current,
            [campaignId]: {
                ambassador_id: '',
                target_count: 50,
                deadline: '',
                ...(current[campaignId] || {}),
                ...patch,
            },
        }))
    }

    const assignAmbassadorToCampaign = async (campaign) => {
        const draft = assignmentDrafts[campaign.id] || {}

        if (!draft.ambassador_id) {
            setMessage('Please select an ambassador.')
            return
        }

        setAssigningCampaignId(campaign.id)
        setMessage('')

        const ambassador = getAmbassadorById(draft.ambassador_id)
        const namePart = slugify(ambassador?.full_name || ambassador?.email || 'ambassador')

        const result = await supabase
            .from('ambassador_campaigns')
            .insert({
                ambassador_id: draft.ambassador_id,
                campaign_id: campaign.id,
                ref_code: `${campaign.slug}-${namePart}-${shortCode()}`,
                status: 'active',
                target_count: Number(draft.target_count) || 0,
                deadline: draft.deadline || campaign.end_date || null,
                points_per_lead: Number(campaign.points_per_lead) || 0,
                points_per_conversion: Number(campaign.points_per_conversion) || 0,
                notes: null,
            })

        if (result.error) {
            setMessage(result.error.message)
            setAssigningCampaignId(null)
            return
        }

        setAssignmentDrafts((current) => ({
            ...current,
            [campaign.id]: {
                ambassador_id: '',
                target_count: 50,
                deadline: '',
            },
        }))

        await loadData()
        setAssigningCampaignId(null)
    }

    const toggleAmbassador = (ambassadorId) => {
        setSelectedAmbassadors((current) => {
            if (current.includes(ambassadorId)) {
                return current.filter((id) => id !== ambassadorId)
            }

            return [...current, ambassadorId]
        })
    }

    const handleCreateCampaign = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')

        const baseSlug = slugify(form.title)
        const normalizedExternalUrl = normalizeExternalUrl(form.external_url)

        if (!baseSlug) {
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

        if (form.form_type === 'custom_form') {
            const invalidField = form.form_schema.some((field) => {
                return !field.label?.trim() || !field.name?.trim()
            })

            if (invalidField) {
                setMessage('Every custom field needs a question label and field key.')
                setSaving(false)
                return
            }
        }

        const finalSlug = `${baseSlug}-${shortCode()}`

        const campaignResult = await supabase
            .from('campaigns')
            .insert({
                title: form.title.trim(),
                slug: finalSlug,
                description: form.description.trim() || null,
                type: form.type,
                goal_type: form.goal_type.trim() || 'lead_collection',
                target_count: Number(form.target_count) || 0,
                primary_action: form.primary_action,
                action_mode: form.action_mode,
                audience_type: form.audience_type,
                form_type: form.form_type,
                form_schema: form.form_type === 'custom_form' ? form.form_schema : [],
                external_url: normalizedExternalUrl,
                target_url: normalizedExternalUrl,
                start_date: form.start_date || null,
                end_date: form.end_date || null,
                status: form.status,
                priority: form.priority,
                requires_proof: Boolean(form.requires_proof),
                points_per_lead: Number(form.points_per_lead) || 0,
                points_per_conversion: Number(form.points_per_conversion) || 0,
                points_per_proof: Number(form.points_per_proof) || 0,
            })
            .select()
            .single()

        if (campaignResult.error) {
            setMessage(campaignResult.error.message)
            setSaving(false)
            return
        }

        const campaign = campaignResult.data

        if (selectedAmbassadors.length > 0) {
            const rows = selectedAmbassadors.map((ambassadorId) => {
                const ambassador = getAmbassadorById(ambassadorId)
                const namePart = slugify(ambassador?.full_name || ambassador?.email || 'ambassador')

                return {
                    ambassador_id: ambassadorId,
                    campaign_id: campaign.id,
                    ref_code: `${campaign.slug}-${namePart}-${shortCode()}`,
                    status: 'active',
                    target_count: Number(form.assignment_target_count) || 0,
                    deadline: form.assignment_deadline || form.end_date || null,
                    points_per_lead: Number(form.points_per_lead) || 0,
                    points_per_conversion: Number(form.points_per_conversion) || 0,
                    notes: null,
                }
            })

            const assignmentResult = await supabase
                .from('ambassador_campaigns')
                .insert(rows)

            if (assignmentResult.error) {
                setMessage(assignmentResult.error.message)
                setSaving(false)
                return
            }
        }

        setForm(initialForm)
        setSelectedAmbassadors([])
        await loadData()
        setSaving(false)
    }

    const updateCampaignStatus = async (campaignId, status) => {
        setMessage('')

        const result = await supabase
            .from('campaigns')
            .update({ status })
            .eq('id', campaignId)

        if (result.error) {
            setMessage(result.error.message)
            return
        }

        await loadData()
    }

    const copyReferralLink = async (refCode) => {
        const link = `${window.location.origin}/c/${refCode}`
        await navigator.clipboard.writeText(link)
        alert('Referral link copied')
    }

    return (
        <DashboardLayout
            role="admin"
            title="Campaigns"
            subtitle="Create flexible Frint operations"
        >
            <div className="grid gap-6 xl:grid-cols-[520px_1fr]">
                <section className="frint-card rounded-[30px] p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
                            <Megaphone size={21} />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                New campaign
                            </h2>
                            <p className="text-sm frint-muted">
                                Operation, action, assignment
                            </p>
                        </div>
                    </div>

                    {message && (
                        <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleCreateCampaign} className="mt-6 space-y-5">
                        <div className="rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
                            <p className="mb-4 text-sm font-black text-[var(--frint-text)]">
                                Basic details
                            </p>

                            <div className="space-y-4">
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
                                    className="min-h-20 w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Short note"
                                />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    >
                                        {campaignTypes.map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>

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
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
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
                            </div>
                        </div>

                        <div className="rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
                            <p className="mb-4 text-sm font-black text-[var(--frint-text)]">
                                Goal and action
                            </p>

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
                                    value={form.primary_action}
                                    onChange={(e) => setForm({ ...form, primary_action: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                >
                                    {primaryActions.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={form.audience_type}
                                    onChange={(e) => setForm({ ...form, audience_type: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                >
                                    {audienceTypes.map(([value, label]) => (
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

                                <input
                                    value={form.goal_type}
                                    onChange={(e) => setForm({ ...form, goal_type: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Goal type"
                                />
                            </div>

                            <input
                                value={form.external_url}
                                onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                                className="mt-4 w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="External URL, needed for external/hybrid campaigns"
                            />

                            {form.form_type === 'custom_form' && (
                                <div className="mt-4">
                                    <CampaignFormBuilder
                                        value={form.form_schema}
                                        onChange={(schema) =>
                                            setForm({
                                                ...form,
                                                form_schema: schema,
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <div className="rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
                            <p className="mb-4 text-sm font-black text-[var(--frint-text)]">
                                Points and proof
                            </p>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <input
                                    type="number"
                                    min="0"
                                    value={form.points_per_lead}
                                    onChange={(e) => setForm({ ...form, points_per_lead: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Points per lead"
                                />

                                <input
                                    type="number"
                                    min="0"
                                    value={form.points_per_conversion}
                                    onChange={(e) => setForm({ ...form, points_per_conversion: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Points per conversion"
                                />

                                <input
                                    type="number"
                                    min="0"
                                    value={form.points_per_proof}
                                    onChange={(e) => setForm({ ...form, points_per_proof: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Points per proof"
                                />
                            </div>

                            <label className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--frint-card)] px-4 py-3 text-sm font-bold text-[var(--frint-text)]">
                                <input
                                    type="checkbox"
                                    checked={form.requires_proof}
                                    onChange={(e) => setForm({ ...form, requires_proof: e.target.checked })}
                                />
                                Require proof upload
                            </label>
                        </div>

                        <div className="rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
                            <p className="mb-4 text-sm font-black text-[var(--frint-text)]">
                                Ambassador assignment
                            </p>

                            <div className="mb-4 grid gap-4 sm:grid-cols-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={form.assignment_target_count}
                                    onChange={(e) => setForm({ ...form, assignment_target_count: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Target per ambassador"
                                />

                                <input
                                    type="date"
                                    value={form.assignment_deadline}
                                    onChange={(e) => setForm({ ...form, assignment_deadline: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                />
                            </div>

                            <div className="max-h-56 space-y-2 overflow-y-auto">
                                {ambassadors.length === 0 ? (
                                    <p className="text-sm font-bold frint-muted">
                                        No active ambassadors found.
                                    </p>
                                ) : (
                                    ambassadors.map((ambassador) => (
                                        <label
                                            key={ambassador.id}
                                            className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[var(--frint-card)] px-3 py-3"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedAmbassadors.includes(ambassador.id)}
                                                onChange={() => toggleAmbassador(ambassador.id)}
                                            />

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-black text-[var(--frint-text)]">
                                                    {ambassador.full_name || ambassador.email}
                                                </p>
                                                <p className="truncate text-xs frint-muted">
                                                    {ambassador.colleges?.name || 'No college'}
                                                </p>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="frint-primary-btn flex w-full items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60"
                        >
                            <Plus size={17} />
                            {saving ? 'Creating...' : 'Create campaign'}
                        </button>
                    </form>
                </section>

                <section className="frint-card rounded-[30px] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                Campaign list
                            </h2>
                            <p className="mt-1 text-sm frint-muted">
                                Track progress and referral links
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="flex items-center gap-2 rounded-full border frint-border bg-[var(--frint-card)] px-4 py-2.5">
                                <Search size={17} className="frint-muted" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search"
                                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 sm:w-56"
                                />
                            </div>

                            <button
                                onClick={loadData}
                                className="frint-secondary-btn flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        {loading ? (
                            <div className="rounded-[24px] border frint-border p-8 text-center text-sm font-bold frint-muted">
                                Loading campaigns...
                            </div>
                        ) : filteredCampaigns.length === 0 ? (
                            <EmptyState
                                title="No campaigns found"
                                message="Create the first Frint campaign from the form."
                            />
                        ) : (
                            filteredCampaigns.map((campaign) => {
                                const campaignAssignments = getCampaignAssignments(campaign.id)
                                const progress = getCampaignProgress(campaign.id)
                                const progressPercent = Number(progress?.progress_percent || 0)

                                return (
                                    <div key={campaign.id} className="rounded-[26px] border frint-border p-5">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-lg font-black text-[var(--frint-text)]">
                                                        {campaign.title}
                                                    </h3>
                                                    <StatusBadge status={campaign.status} />
                                                </div>

                                                <p className="mt-2 text-sm font-bold frint-muted">
                                                    {getLabel(campaignTypes, campaign.type)} • {getLabel(actionModes, campaign.action_mode)}
                                                </p>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <span className="rounded-full bg-[var(--frint-soft-card)] px-3 py-1 text-xs font-black frint-muted">
                                                        {getLabel(audienceTypes, campaign.audience_type)}
                                                    </span>

                                                    <span className="rounded-full bg-[var(--frint-soft-card)] px-3 py-1 text-xs font-black frint-muted">
                                                        {getLabel(formTypes, campaign.form_type)}
                                                    </span>

                                                    <span className="rounded-full bg-[var(--frint-soft-card)] px-3 py-1 text-xs font-black frint-muted">
                                                        {campaign.priority}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <Link
                                                    to={`/admin/campaigns/${campaign.id}`}
                                                    className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                                                >
                                                    View details
                                                </Link>

                                                <select
                                                    value={campaign.status || 'draft'}
                                                    onChange={(e) => updateCampaignStatus(campaign.id, e.target.value)}
                                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-bold outline-none"
                                                >
                                                    <option value="draft">Draft</option>
                                                    <option value="active">Active</option>
                                                    <option value="paused">Paused</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-[20px] bg-[var(--frint-soft-card)] p-4">
                                                <div className="flex items-center gap-2 text-[#0060f8]">
                                                    <Target size={17} />
                                                    <p className="text-sm font-black">Progress</p>
                                                </div>

                                                <p className="mt-2 text-2xl font-black text-[var(--frint-text)]">
                                                    {progress?.total_leads || 0}/{campaign.target_count || 0}
                                                </p>
                                            </div>

                                            <div className="rounded-[20px] bg-[var(--frint-soft-card)] p-4">
                                                <div className="flex items-center gap-2 text-[#0060f8]">
                                                    <Users size={17} />
                                                    <p className="text-sm font-black">Assigned</p>
                                                </div>

                                                <p className="mt-2 text-2xl font-black text-[var(--frint-text)]">
                                                    {campaignAssignments.length}
                                                </p>
                                            </div>

                                            <div className="rounded-[20px] bg-[var(--frint-soft-card)] p-4">
                                                <p className="text-sm font-black frint-muted">
                                                    Converted
                                                </p>

                                                <p className="mt-2 text-2xl font-black text-[var(--frint-text)]">
                                                    {progress?.converted_leads || 0}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
                                            <div
                                                className="h-full rounded-full bg-[#0060f8]"
                                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    )
}