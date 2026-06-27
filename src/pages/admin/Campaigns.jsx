import { useEffect, useMemo, useState } from 'react'
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    Plus,
    RefreshCw,
    Search,
    Target,
    Users,
    X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'
import CampaignFormBuilder from '../../components/admin/CampaignFormBuilder'

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

const steps = [
    { id: 1, title: 'Campaign info', helper: 'Name the operation and choose its basic type.' },
    { id: 2, title: 'Student flow', helper: 'Decide how students will submit or continue.' },
    { id: 3, title: 'Ambassadors', helper: 'Pick who will work on this campaign.' },
    { id: 4, title: 'Publish', helper: 'Review points, status, and launch.' },
]

const actionModeHelp = {
    internal_form: 'Students fill a Frint form. Best for leads, registrations, and applications.',
    external_link: 'Students go directly to Google Form, website, or any external link.',
    hybrid: 'Students submit basic details in Frint, then continue to an external link.',
    tracking_only: 'No public form. Use this when the campaign is only for internal tracking.',
}

const primaryActionHelp = {
    collect_leads: 'Use when ambassadors need to collect interested student details.',
    collect_registrations: 'Use for event, workshop, or webinar registrations.',
    collect_applications: 'Use for internships, hiring, or program applications.',
    send_link: 'Use when ambassadors mainly need to share a link.',
    confirm_attendance: 'Use when the goal is attendance confirmation.',
    collect_feedback: 'Use for surveys and feedback collection.',
    upload_proof: 'Use when ambassadors must submit proof of work.',
    company_followup: 'Use for company or partner follow-up tasks.',
}

const formTypeHelp = {
    basic_student_form: 'Simple student details form. Good default choice.',
    internship_form: 'Adds internship-related fields.',
    event_form: 'Good for workshop, event, or webinar registration.',
    feedback_form: 'Good for surveys and feedback.',
    ambassador_application_form: 'Good for recruiting new ambassadors.',
    custom_form: 'Build your own questions for this campaign.',
    none: 'No Frint form will be shown.',
}

function normalizeExternalUrl(url) {
    if (!url) return null
    const cleanedUrl = url.trim()
    if (!cleanedUrl) return null
    if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) return cleanedUrl
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

function FieldBlock({ label, helper, children }) {
    return (
        <label className="block">
            <span className="text-[13px] font-semibold text-[var(--frint-text)]">{label}</span>
            {helper && <span className="mt-0.5 block text-[12px] font-medium leading-5 frint-muted">{helper}</span>}
            <div className="mt-2">{children}</div>
        </label>
    )
}

function InfoNote({ children }) {
    return (
        <div className="mt-3 rounded-2xl border frint-border bg-[var(--frint-card)] px-3 py-2.5 text-[12px] font-medium leading-5 frint-muted">
            {children}
        </div>
    )
}

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([])
    const [progressRows, setProgressRows] = useState([])
    const [ambassadors, setAmbassadors] = useState([])
    const [assignments, setAssignments] = useState([])
    const [selectedAmbassadors, setSelectedAmbassadors] = useState([])
    const [form, setForm] = useState(initialForm)
    const [search, setSearch] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [step, setStep] = useState(1)
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

    const toggleAmbassador = (ambassadorId) => {
        setSelectedAmbassadors((current) => {
            if (current.includes(ambassadorId)) return current.filter((id) => id !== ambassadorId)
            return [...current, ambassadorId]
        })
    }

    const openCreateForm = () => {
        setShowCreate(true)
        setStep(1)
        window.setTimeout(() => {
            document.getElementById('new-campaign-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 60)
    }

    const closeCreateForm = () => {
        setShowCreate(false)
        setStep(1)
        setMessage('')
    }

    const goNext = () => {
        setMessage('')

        if (step === 1 && !slugify(form.title)) {
            setMessage('Add a campaign title first.')
            return
        }

        if (step === 2 && ['external_link', 'hybrid'].includes(form.action_mode) && !normalizeExternalUrl(form.external_url)) {
            setMessage('Add an external URL for external or hybrid campaigns.')
            return
        }

        setStep((current) => Math.min(current + 1, steps.length))
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
            setStep(1)
            return
        }

        if (['external_link', 'hybrid'].includes(form.action_mode) && !normalizedExternalUrl) {
            setMessage('External URL is required for external and hybrid campaigns.')
            setSaving(false)
            setStep(2)
            return
        }

        if (form.form_type === 'custom_form') {
            const invalidField = form.form_schema.some((field) => !field.label?.trim() || !field.name?.trim())
            if (invalidField) {
                setMessage('Every custom field needs a question label and field key.')
                setSaving(false)
                setStep(2)
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
        setShowCreate(false)
        setStep(1)
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

    const currentStep = steps.find((item) => item.id === step)

    return (
        <DashboardLayout role="admin" title="Campaigns" subtitle="Create and track Frint operations">
            <div className="space-y-4">
                <section className="frint-card rounded-[24px] p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--frint-text)]">Campaign list</h2>
                            <p className="mt-0.5 text-sm frint-muted">{filteredCampaigns.length} campaigns</p>
                        </div>

                        <div className="grid gap-2 sm:flex sm:items-center">
                            <button type="button" onClick={openCreateForm} className="frint-primary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm">
                                <Plus size={15} />
                                New campaign
                            </button>

                            <div className="flex min-w-0 items-center gap-2 rounded-full border frint-border bg-[var(--frint-card)] px-3 py-2">
                                <Search size={16} className="shrink-0 frint-muted" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search"
                                    className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 sm:w-56"
                                />
                            </div>

                            <button type="button" onClick={loadData} className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm">
                                <RefreshCw size={15} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {message && !showCreate && (
                        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</div>
                    )}

                    <div className="mt-4 space-y-3">
                        {loading ? (
                            <div className="rounded-[20px] border frint-border p-6 text-center text-sm font-medium frint-muted">Loading campaigns...</div>
                        ) : filteredCampaigns.length === 0 ? (
                            <EmptyState title="No campaigns found" message="Create the first Frint campaign from the button above." />
                        ) : (
                            filteredCampaigns.map((campaign) => {
                                const campaignAssignments = getCampaignAssignments(campaign.id)
                                const progress = getCampaignProgress(campaign.id)
                                const progressPercent = Number(progress?.progress_percent || 0)

                                return (
                                    <article key={campaign.id} className="rounded-[20px] border frint-border bg-[var(--frint-card)] p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="truncate text-[16px] font-semibold text-[var(--frint-text)]">{campaign.title}</h3>
                                                    <StatusBadge status={campaign.status} />
                                                </div>

                                                <p className="mt-1 truncate text-sm font-medium frint-muted">
                                                    {getLabel(campaignTypes, campaign.type)} • {getLabel(actionModes, campaign.action_mode)}
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    <span className="rounded-full bg-[var(--frint-soft-card)] px-2.5 py-1 text-[11px] font-semibold frint-muted">
                                                        {getLabel(audienceTypes, campaign.audience_type)}
                                                    </span>
                                                    <span className="rounded-full bg-[var(--frint-soft-card)] px-2.5 py-1 text-[11px] font-semibold frint-muted">
                                                        {getLabel(formTypes, campaign.form_type)}
                                                    </span>
                                                    <span className="rounded-full bg-[var(--frint-soft-card)] px-2.5 py-1 text-[11px] font-semibold frint-muted">
                                                        {campaign.priority}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                                                <Link to={`/admin/campaigns/${campaign.id}`} className="frint-secondary-btn flex items-center justify-center px-3 py-2 text-sm">
                                                    Details
                                                </Link>

                                                <select
                                                    value={campaign.status || 'draft'}
                                                    onChange={(e) => updateCampaignStatus(campaign.id, e.target.value)}
                                                    className="rounded-full border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-medium outline-none"
                                                >
                                                    <option value="draft">Draft</option>
                                                    <option value="active">Active</option>
                                                    <option value="paused">Paused</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            <div className="min-w-0 rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                                                <div className="flex items-center gap-1.5 text-[var(--frint-blue)]">
                                                    <Target size={14} />
                                                    <p className="truncate text-[11px] font-semibold">Progress</p>
                                                </div>
                                                <p className="mt-1 truncate text-[17px] font-semibold text-[var(--frint-text)]">{progress?.total_leads || 0}/{campaign.target_count || 0}</p>
                                            </div>

                                            <div className="min-w-0 rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                                                <div className="flex items-center gap-1.5 text-[var(--frint-blue)]">
                                                    <Users size={14} />
                                                    <p className="truncate text-[11px] font-semibold">Assigned</p>
                                                </div>
                                                <p className="mt-1 truncate text-[17px] font-semibold text-[var(--frint-text)]">{campaignAssignments.length}</p>
                                            </div>

                                            <div className="min-w-0 rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                                                <p className="truncate text-[11px] font-semibold frint-muted">Converted</p>
                                                <p className="mt-1 truncate text-[17px] font-semibold text-[var(--frint-text)]">{progress?.converted_leads || 0}</p>
                                            </div>
                                        </div>

                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
                                            <div className="h-full rounded-full bg-[var(--frint-accent)]" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                                        </div>
                                    </article>
                                )
                            })
                        )}
                    </div>
                </section>

                {showCreate && (
                    <section id="new-campaign-form" className="frint-card rounded-[24px] p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="frint-icon-chip"><Megaphone size={19} /></div>
                                <div>
                                    <h2 className="text-lg font-semibold text-[var(--frint-text)]">New campaign</h2>
                                    <p className="text-sm frint-muted">Step {step} of {steps.length}: {currentStep?.title}</p>
                                </div>
                            </div>

                            <button type="button" onClick={closeCreateForm} className="frint-secondary-btn flex h-9 w-9 items-center justify-center p-0" aria-label="Close campaign form">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {steps.map((item) => {
                                const active = item.id === step
                                const completed = item.id < step

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setStep(item.id)}
                                        className={[
                                            'rounded-2xl border px-2 py-2 text-left transition',
                                            active ? 'border-[var(--frint-accent)] bg-[var(--frint-accent-soft)]' : 'border-[var(--frint-border)] bg-[var(--frint-card)]',
                                        ].join(' ')}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {completed ? (
                                                <CheckCircle2 size={14} className="text-[var(--frint-accent)]" />
                                            ) : (
                                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--frint-soft-card)] text-[10px] font-semibold frint-muted">{item.id}</span>
                                            )}
                                            <span className="hidden truncate text-[11px] font-semibold text-[var(--frint-text)] sm:block">{item.title}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        <InfoNote>{currentStep?.helper}</InfoNote>

                        {message && (
                            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</div>
                        )}

                        <form onSubmit={handleCreateCampaign} className="mt-4">
                            {step === 1 && (
                                <div className="grid gap-3">
                                    <FieldBlock label="Campaign title" helper="Use a clear name. Example: Summer Internship Drive 2026.">
                                        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="frint-input" placeholder="Summer Internship Drive 2026" required />
                                    </FieldBlock>

                                    <FieldBlock label="Short description" helper="This helps admins and ambassadors understand the purpose.">
                                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="frint-input min-h-20 resize-y" placeholder="Collect student registrations for internship opportunities." />
                                    </FieldBlock>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <FieldBlock label="Campaign type" helper="Choose the closest category.">
                                            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="frint-input">
                                                {campaignTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                            </select>
                                        </FieldBlock>

                                        <FieldBlock label="Priority" helper="Use urgent only for time-sensitive work.">
                                            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="frint-input">
                                                {priorities.map(([value, label]) => <option key={value} value={value}>{label} priority</option>)}
                                            </select>
                                        </FieldBlock>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <FieldBlock label="Start date" helper="Optional. Leave blank if it starts now.">
                                            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="frint-input" />
                                        </FieldBlock>

                                        <FieldBlock label="End date" helper="Optional. Useful for deadline-based campaigns.">
                                            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="frint-input" />
                                        </FieldBlock>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="grid gap-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <FieldBlock label="How will students submit?" helper={actionModeHelp[form.action_mode]}>
                                            <select value={form.action_mode} onChange={(e) => setForm({ ...form, action_mode: e.target.value })} className="frint-input">
                                                {actionModes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                            </select>
                                        </FieldBlock>

                                        <FieldBlock label="What should ambassadors do?" helper={primaryActionHelp[form.primary_action]}>
                                            <select value={form.primary_action} onChange={(e) => setForm({ ...form, primary_action: e.target.value })} className="frint-input">
                                                {primaryActions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                            </select>
                                        </FieldBlock>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <FieldBlock label="Target audience" helper="Who is this campaign mainly for?">
                                            <select value={form.audience_type} onChange={(e) => setForm({ ...form, audience_type: e.target.value })} className="frint-input">
                                                {audienceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                            </select>
                                        </FieldBlock>

                                        <FieldBlock label="Frint form type" helper={formTypeHelp[form.form_type]}>
                                            <select value={form.form_type} onChange={(e) => setForm({ ...form, form_type: e.target.value })} className="frint-input">
                                                {formTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                            </select>
                                        </FieldBlock>
                                    </div>

                                    <FieldBlock label="Campaign target" helper="Total number of leads, registrations, or actions expected.">
                                        <input type="number" min="0" value={form.target_count} onChange={(e) => setForm({ ...form, target_count: e.target.value })} className="frint-input" placeholder="100" />
                                    </FieldBlock>

                                    {['external_link', 'hybrid'].includes(form.action_mode) && (
                                        <FieldBlock label="External URL" helper="Paste Google Form, event page, website, or any final destination link.">
                                            <input value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} className="frint-input" placeholder="https://forms.gle/..." />
                                        </FieldBlock>
                                    )}

                                    {form.form_type === 'custom_form' && (
                                        <div className="rounded-[20px] border frint-border bg-[var(--frint-soft-card)] p-3">
                                            <p className="text-sm font-semibold text-[var(--frint-text)]">Custom questions</p>
                                            <p className="mt-1 text-[12px] font-medium frint-muted">Add only the questions you really need. Short forms get more submissions.</p>
                                            <div className="mt-3">
                                                <CampaignFormBuilder value={form.form_schema} onChange={(schema) => setForm({ ...form, form_schema: schema })} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 3 && (
                                <div className="grid gap-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <FieldBlock label="Target per ambassador" helper="Example: each ambassador should bring 50 leads.">
                                            <input type="number" min="0" value={form.assignment_target_count} onChange={(e) => setForm({ ...form, assignment_target_count: e.target.value })} className="frint-input" placeholder="50" />
                                        </FieldBlock>

                                        <FieldBlock label="Ambassador deadline" helper="Optional. Leave blank to use campaign end date.">
                                            <input type="date" value={form.assignment_deadline} onChange={(e) => setForm({ ...form, assignment_deadline: e.target.value })} className="frint-input" />
                                        </FieldBlock>
                                    </div>

                                    <div className="rounded-[20px] border frint-border bg-[var(--frint-soft-card)] p-3">
                                        <p className="text-sm font-semibold text-[var(--frint-text)]">Assign ambassadors</p>
                                        <p className="mt-1 text-[12px] font-medium frint-muted">{selectedAmbassadors.length} selected. You can also assign more later from campaign details.</p>

                                        <div className="frint-scrollbar mt-3 max-h-64 space-y-2 overflow-y-auto">
                                            {ambassadors.length === 0 ? (
                                                <p className="text-sm font-medium frint-muted">No active ambassadors found.</p>
                                            ) : (
                                                ambassadors.map((ambassador) => (
                                                    <label key={ambassador.id} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[var(--frint-card)] px-3 py-2.5">
                                                        <input type="checkbox" checked={selectedAmbassadors.includes(ambassador.id)} onChange={() => toggleAmbassador(ambassador.id)} />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-[var(--frint-text)]">{ambassador.full_name || ambassador.email}</p>
                                                            <p className="truncate text-xs frint-muted">{ambassador.colleges?.name || 'No college'}</p>
                                                        </div>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="grid gap-3">
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <FieldBlock label="Points per lead" helper="Awarded when a lead is submitted.">
                                            <input type="number" min="0" value={form.points_per_lead} onChange={(e) => setForm({ ...form, points_per_lead: e.target.value })} className="frint-input" placeholder="5" />
                                        </FieldBlock>

                                        <FieldBlock label="Points per conversion" helper="Awarded when lead becomes converted.">
                                            <input type="number" min="0" value={form.points_per_conversion} onChange={(e) => setForm({ ...form, points_per_conversion: e.target.value })} className="frint-input" placeholder="20" />
                                        </FieldBlock>

                                        <FieldBlock label="Points per proof" helper="Awarded after admin approves proof.">
                                            <input type="number" min="0" value={form.points_per_proof} onChange={(e) => setForm({ ...form, points_per_proof: e.target.value })} className="frint-input" placeholder="10" />
                                        </FieldBlock>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <FieldBlock label="Launch status" helper="Active starts immediately. Draft keeps it hidden from public use.">
                                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="frint-input">
                                                <option value="draft">Draft</option>
                                                <option value="active">Active</option>
                                                <option value="paused">Paused</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </FieldBlock>

                                        <label className="flex h-full items-center gap-3 rounded-[20px] border frint-border bg-[var(--frint-soft-card)] px-4 py-3 text-sm font-medium text-[var(--frint-text)]">
                                            <input type="checkbox" checked={form.requires_proof} onChange={(e) => setForm({ ...form, requires_proof: e.target.checked })} />
                                            Require proof upload from ambassadors
                                        </label>
                                    </div>

                                    <div className="rounded-[20px] border frint-border bg-[var(--frint-soft-card)] p-3">
                                        <p className="text-sm font-semibold text-[var(--frint-text)]">Review</p>
                                        <div className="mt-3 grid gap-2 text-sm frint-muted sm:grid-cols-2">
                                            <p><span className="font-semibold text-[var(--frint-text)]">Title:</span> {form.title || 'Not added'}</p>
                                            <p><span className="font-semibold text-[var(--frint-text)]">Type:</span> {getLabel(campaignTypes, form.type)}</p>
                                            <p><span className="font-semibold text-[var(--frint-text)]">Student flow:</span> {getLabel(actionModes, form.action_mode)}</p>
                                            <p><span className="font-semibold text-[var(--frint-text)]">Form:</span> {getLabel(formTypes, form.form_type)}</p>
                                            <p><span className="font-semibold text-[var(--frint-text)]">Target:</span> {form.target_count}</p>
                                            <p><span className="font-semibold text-[var(--frint-text)]">Ambassadors:</span> {selectedAmbassadors.length}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <button type="button" onClick={() => setStep((current) => Math.max(current - 1, 1))} disabled={step === 1} className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
                                    <ChevronLeft size={15} />
                                    Back
                                </button>

                                {step < steps.length ? (
                                    <button type="button" onClick={goNext} className="frint-primary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm">
                                        Continue
                                        <ChevronRight size={15} />
                                    </button>
                                ) : (
                                    <button type="submit" disabled={saving} className="frint-primary-btn flex items-center justify-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60">
                                        <Plus size={16} />
                                        {saving ? 'Creating...' : 'Publish campaign'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>
                )}
            </div>
        </DashboardLayout>
    )
}
