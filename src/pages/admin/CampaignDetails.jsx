import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    ArrowLeft,
    Copy,
    FileText,
    Link2,
    Loader2,
    Megaphone,
    Pencil,
    Plus,
    RefreshCw,
    Target,
    Trash2,
    UserPlus,
    Users,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'
import CampaignSettingsEditor from '../../components/admin/CampaignSettingsEditor'

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

function formatLabel(value) {
    return value?.replaceAll('_', ' ') || 'Not set'
}

function formatCustomValue(value) {
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (value === null || value === undefined || value === '') return 'Not answered'
    if (typeof value === 'object') return JSON.stringify(value)

    return String(value)
}

function shortDate(date) {
    if (!date) return 'No date'
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function CustomAnswers({ answers }) {
    const entries = Object.entries(answers || {})

    if (entries.length === 0) return null

    return (
        <div className="mt-3 rounded-[16px] bg-[var(--frint-soft-card)] p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide frint-muted">
                Custom answers
            </p>

            <div className="space-y-1">
                {entries.map(([key, value]) => (
                    <p key={key} className="text-sm font-medium frint-muted">
                        <span className="font-semibold capitalize text-[var(--frint-text)]">
                            {key.replaceAll('_', ' ')}:
                        </span>{' '}
                        {formatCustomValue(value)}
                    </p>
                ))}
            </div>
        </div>
    )
}

export default function CampaignDetails() {
    const { id } = useParams()

    const [campaign, setCampaign] = useState(null)
    const [progress, setProgress] = useState(null)
    const [assignments, setAssignments] = useState([])
    const [ambassadors, setAmbassadors] = useState([])
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingStatus, setSavingStatus] = useState(false)
    const [assigning, setAssigning] = useState(false)
    const [message, setMessage] = useState('')
    const [showAssignBox, setShowAssignBox] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [assignmentForm, setAssignmentForm] = useState({
        ambassador_id: '',
        target_count: 50,
        deadline: '',
    })

    const loadData = async () => {
        setLoading(true)
        setMessage('')

        const campaignResult = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        const progressResult = await supabase
            .from('campaign_progress')
            .select('*')
            .eq('campaign_id', id)
            .maybeSingle()

        const assignmentResult = await supabase
            .from('ambassador_campaigns')
            .select('*')
            .eq('campaign_id', id)
            .order('assigned_at', { ascending: false })

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
            .order('full_name', { ascending: true })

        const leadsResult = await supabase
            .from('leads')
            .select(`
        id,
        student_name,
        email,
        phone,
        course,
        year,
        city,
        interest,
        status,
        form_type,
        raw_answers,
        ambassador_id,
        college_id,
        created_at,
        colleges (
          id,
          name,
          city
        )
      `)
            .eq('campaign_id', id)
            .order('created_at', { ascending: false })

        const errors = [
            campaignResult.error,
            progressResult.error,
            assignmentResult.error,
            ambassadorResult.error,
            leadsResult.error,
        ].filter(Boolean)

        if (errors.length > 0) {
            setMessage(errors[0].message)
        }

        setCampaign(campaignResult.data || null)
        setProgress(progressResult.data || null)
        setAssignments(assignmentResult.data || [])
        setAmbassadors(ambassadorResult.data || [])
        setLeads(leadsResult.data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [id])

    const getAmbassadorById = (ambassadorId) => {
        return ambassadors.find((ambassador) => ambassador.id === ambassadorId)
    }

    const activeUnassignedAmbassadors = useMemo(() => {
        const assignedIds = assignments.map((item) => item.ambassador_id)

        return ambassadors.filter((ambassador) => {
            return ambassador.status === 'active' && !assignedIds.includes(ambassador.id)
        })
    }, [ambassadors, assignments])

    const updateCampaignStatus = async (status) => {
        if (!campaign) return

        setSavingStatus(true)
        setMessage('')

        const result = await supabase
            .from('campaigns')
            .update({ status })
            .eq('id', campaign.id)

        if (result.error) {
            setMessage(result.error.message)
            setSavingStatus(false)
            return
        }

        await loadData()
        setSavingStatus(false)
    }

    const assignAmbassador = async () => {
        if (!campaign) return

        if (!assignmentForm.ambassador_id) {
            setMessage('Please select an ambassador.')
            return
        }

        setAssigning(true)
        setMessage('')

        const ambassador = getAmbassadorById(assignmentForm.ambassador_id)
        const namePart = slugify(ambassador?.full_name || ambassador?.email || 'ambassador')
        const campaignSlug = campaign.slug || slugify(campaign.title)

        const result = await supabase
            .from('ambassador_campaigns')
            .insert({
                ambassador_id: assignmentForm.ambassador_id,
                campaign_id: campaign.id,
                ref_code: `${campaignSlug}-${namePart}-${shortCode()}`,
                status: 'active',
                target_count: Number(assignmentForm.target_count) || 0,
                deadline: assignmentForm.deadline || campaign.end_date || null,
                points_per_lead: Number(campaign.points_per_lead) || 0,
                points_per_conversion: Number(campaign.points_per_conversion) || 0,
                notes: null,
            })

        if (result.error) {
            setMessage(result.error.message)
            setAssigning(false)
            return
        }

        setAssignmentForm({
            ambassador_id: '',
            target_count: 50,
            deadline: '',
        })

        setShowAssignBox(false)
        await loadData()
        setAssigning(false)
    }

    const copyReferralLink = async (refCode) => {
        const link = `${window.location.origin}/c/${refCode}`
        await navigator.clipboard.writeText(link)
        alert('Referral link copied')
    }

    const updateLeadStatus = async (leadId, status) => {
        setMessage('')

        const result = await supabase
            .from('leads')
            .update({ status })
            .eq('id', leadId)

        if (result.error) {
            setMessage(result.error.message)
            return
        }

        await loadData()
    }

    const deleteCampaign = async () => {
        if (!campaign) return

        let warningMessage = `Delete "${campaign.title}"?\n\nThis will remove campaign assignments, leads, and linked tasks. This cannot be undone.`

        if (campaign.status === 'completed') {
            warningMessage = `Warning: "${campaign.title}" is marked as COMPLETED. Deleting it will erase all history, leads, and reports associated with it, which is not recommended. It is better to leave it completed.\n\nDo you still want to delete it?`
        } else if (campaign.status === 'active' && leads.length > 0) {
            warningMessage = `Warning: "${campaign.title}" is ACTIVE and has already collected ${leads.length} lead(s). Deleting it will permanently remove all assignments, tasks, and collected leads.\n\nDo you still want to delete it?`
        }

        const confirmDelete = window.confirm(warningMessage)
        if (!confirmDelete) return

        const secondConfirm = window.prompt(
            'Type DELETE to confirm campaign deletion.'
        )
        if (secondConfirm !== 'DELETE') return

        setDeleting(true)
        setMessage('')

        // 1. Get task IDs linked to the campaign
        const taskIdsResult = await supabase
            .from('tasks')
            .select('id')
            .eq('campaign_id', campaign.id)

        if (taskIdsResult.error) {
            setMessage(taskIdsResult.error.message)
            setDeleting(false)
            return
        }

        const taskIds = (taskIdsResult.data || []).map((task) => task.id)

        // 2. Delete task assignments
        if (taskIds.length > 0) {
            const assignmentDelete = await supabase
                .from('task_assignments')
                .delete()
                .in('task_id', taskIds)

            if (assignmentDelete.error) {
                setMessage(assignmentDelete.error.message)
                setDeleting(false)
                return
            }
        }

        // 3. Delete tasks
        const tasksDelete = await supabase
            .from('tasks')
            .delete()
            .eq('campaign_id', campaign.id)

        if (tasksDelete.error) {
            setMessage(tasksDelete.error.message)
            setDeleting(false)
            return
        }

        // 4. Delete leads
        const leadsDelete = await supabase
            .from('leads')
            .delete()
            .eq('campaign_id', campaign.id)

        if (leadsDelete.error) {
            setMessage(leadsDelete.error.message)
            setDeleting(false)
            return
        }

        // 5. Delete ambassador campaign assignments
        const ambassadorCampaignDelete = await supabase
            .from('ambassador_campaigns')
            .delete()
            .eq('campaign_id', campaign.id)

        if (ambassadorCampaignDelete.error) {
            setMessage(ambassadorCampaignDelete.error.message)
            setDeleting(false)
            return
        }

        // 6. Delete campaign
        const campaignDelete = await supabase
            .from('campaigns')
            .delete()
            .eq('id', campaign.id)

        if (campaignDelete.error) {
            setMessage(campaignDelete.error.message)
            setDeleting(false)
            return
        }

        window.location.href = '/admin/campaigns'
    }

    if (loading) {
        return (
            <DashboardLayout
                role="admin"
                title="Campaign Details"
                subtitle="Loading campaign"
            >
                <div className="frint-card flex items-center justify-center gap-3 rounded-[24px] p-6">
                    <Loader2 className="animate-spin text-[var(--frint-accent)]" size={21} />
                    <p className="text-sm font-semibold frint-muted">Loading campaign...</p>
                </div>
            </DashboardLayout>
        )
    }

    if (!campaign) {
        return (
            <DashboardLayout
                role="admin"
                title="Campaign Details"
                subtitle="Campaign not found"
            >
                <EmptyState
                    title="Campaign not found"
                    message="This campaign does not exist or you do not have access."
                />
            </DashboardLayout>
        )
    }

    const progressPercent = Math.min(Number(progress?.progress_percent || 0), 100)
    const formSchema = Array.isArray(campaign.form_schema) ? campaign.form_schema : []

    const stats = [
        {
            label: 'Progress',
            value: `${progress?.total_leads || 0}/${campaign.target_count || 0}`,
            icon: Target,
        },
        {
            label: 'Assigned',
            value: assignments.length,
            icon: Users,
        },
        {
            label: 'Registered',
            value: progress?.registered_leads || 0,
            icon: FileText,
        },
        {
            label: 'Converted',
            value: progress?.converted_leads || 0,
            icon: Megaphone,
        },
    ]

    return (
        <DashboardLayout
            role="admin"
            title="Campaign Details"
            subtitle={campaign.title}
        >
            <div className="mb-4 flex items-center justify-between gap-2">
                <Link
                    to="/admin/campaigns"
                    className="frint-secondary-btn flex items-center gap-2 px-3.5 py-2 text-sm"
                >
                    <ArrowLeft size={15} />
                    Back
                </Link>

                <button
                    onClick={loadData}
                    className="frint-secondary-btn flex items-center gap-2 px-3.5 py-2 text-sm"
                >
                    <RefreshCw size={15} />
                    Refresh
                </button>
            </div>

            {message && (
                <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {message}
                </div>
            )}

            <section className="frint-card rounded-[24px] p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.04em] text-[var(--frint-text)] sm:text-[26px]">
                                {campaign.title}
                            </h1>
                            <StatusBadge status={campaign.status} />
                        </div>

                        <p className="mt-2 text-sm font-medium capitalize frint-muted">
                            {formatLabel(campaign.type)} • {formatLabel(campaign.action_mode)} • {formatLabel(campaign.form_type)}
                        </p>

                        {campaign.description && (
                            <p className="mt-3 max-w-3xl text-sm leading-6 frint-muted">
                                {campaign.description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
                        <button
                            type="button"
                            onClick={() => setShowSettings((value) => !value)}
                            className="frint-secondary-btn flex items-center justify-center gap-2 px-3.5 py-2 text-sm"
                        >
                            <Pencil size={15} />
                            Edit
                        </button>

                        <select
                            value={campaign.status || 'draft'}
                            onChange={(e) => updateCampaignStatus(e.target.value)}
                            disabled={savingStatus}
                            className="rounded-full border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-medium outline-none disabled:opacity-60"
                        >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed</option>
                        </select>

                        <button
                            type="button"
                            onClick={deleteCampaign}
                            disabled={deleting}
                            className="flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 dark:bg-red-950/30 dark:text-red-300 col-span-2 sm:col-span-1"
                        >
                            <Trash2 size={15} />
                            {deleting ? 'Deleting...' : 'Delete campaign'}
                        </button>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {stats.map((item) => {
                        const Icon = item.icon

                        return (
                            <div
                                key={item.label}
                                className="rounded-[18px] bg-[var(--frint-soft-card)] px-3 py-3"
                            >
                                <div className="flex items-center gap-1.5 text-[var(--frint-accent)]">
                                    <Icon size={14} />
                                    <p className="truncate text-[11px] font-semibold">{item.label}</p>
                                </div>

                                <p className="mt-1 text-[18px] font-semibold text-[var(--frint-text)]">
                                    {item.value}
                                </p>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold frint-muted">
                        <span>Campaign progress</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
                        <div
                            className="h-full rounded-full bg-[var(--frint-accent)]"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </section>

            {showSettings && (
                <div className="mt-4">
                    <CampaignSettingsEditor
                        campaign={campaign}
                        onUpdated={loadData}
                    />
                </div>
            )}

            <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.72fr]">
                <section className="frint-card rounded-[24px] p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                                Assigned ambassadors
                            </h2>
                            <p className="mt-0.5 text-sm frint-muted">
                                Referral links and targets
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAssignBox((value) => !value)}
                            className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                        >
                            <UserPlus size={15} />
                            Add ambassador
                        </button>
                    </div>

                    {showAssignBox && (
                        <div className="mt-4 rounded-[18px] border frint-border bg-[var(--frint-soft-card)] p-3">
                            <p className="text-sm font-semibold text-[var(--frint-text)]">
                                Add ambassador
                            </p>
                            <p className="mt-0.5 text-xs frint-muted">
                                This creates a personal referral link for the selected ambassador.
                            </p>

                            {activeUnassignedAmbassadors.length === 0 ? (
                                <p className="mt-3 text-sm font-medium frint-muted">
                                    All active ambassadors are already assigned to this campaign.
                                </p>
                            ) : (
                                <div className="mt-3 grid gap-2 lg:grid-cols-[1.2fr_0.7fr_0.8fr_auto]">
                                    <select
                                        value={assignmentForm.ambassador_id}
                                        onChange={(e) =>
                                            setAssignmentForm({
                                                ...assignmentForm,
                                                ambassador_id: e.target.value,
                                            })
                                        }
                                        className="frint-input"
                                    >
                                        <option value="">Select ambassador</option>
                                        {activeUnassignedAmbassadors.map((ambassador) => (
                                            <option key={ambassador.id} value={ambassador.id}>
                                                {ambassador.full_name || ambassador.email}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="number"
                                        min="0"
                                        value={assignmentForm.target_count}
                                        onChange={(e) =>
                                            setAssignmentForm({
                                                ...assignmentForm,
                                                target_count: e.target.value,
                                            })
                                        }
                                        className="frint-input"
                                        placeholder="Target"
                                    />

                                    <input
                                        type="date"
                                        value={assignmentForm.deadline}
                                        onChange={(e) =>
                                            setAssignmentForm({
                                                ...assignmentForm,
                                                deadline: e.target.value,
                                            })
                                        }
                                        className="frint-input"
                                    />

                                    <button
                                        type="button"
                                        disabled={assigning}
                                        onClick={assignAmbassador}
                                        className="frint-primary-btn flex items-center justify-center gap-2 px-5 py-2 text-sm disabled:opacity-60"
                                    >
                                        <Plus size={15} />
                                        {assigning ? 'Adding...' : 'Add'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-4 space-y-2">
                        {assignments.length === 0 ? (
                            <EmptyState
                                title="No ambassadors assigned"
                                message="Assign ambassadors to generate referral links."
                            />
                        ) : (
                            assignments.map((assignment) => {
                                const ambassador = getAmbassadorById(assignment.ambassador_id)

                                return (
                                    <article
                                        key={assignment.id}
                                        className="rounded-[18px] border frint-border p-3"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-[var(--frint-text)]">
                                                    {ambassador?.full_name || ambassador?.email || 'Ambassador'}
                                                </p>

                                                <p className="mt-0.5 text-xs frint-muted">
                                                    Target {assignment.target_count || 0}
                                                    {assignment.deadline ? ` • ${shortDate(assignment.deadline)}` : ''}
                                                </p>

                                                <p className="mt-1 truncate text-xs frint-muted">
                                                    /c/{assignment.ref_code}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => copyReferralLink(assignment.ref_code)}
                                                className="frint-secondary-btn flex items-center justify-center gap-2 px-3.5 py-2 text-sm"
                                            >
                                                <Copy size={14} />
                                                Copy
                                            </button>
                                        </div>
                                    </article>
                                )
                            })
                        )}
                    </div>
                </section>

                <section className="frint-card rounded-[24px] p-4 sm:p-5">
                    <div className="flex items-center gap-2">
                        <Link2 className="text-[var(--frint-accent)]" size={19} />
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                                Form preview
                            </h2>
                            <p className="text-sm frint-muted">
                                Fields shown on the public form
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-[18px] bg-[var(--frint-soft-card)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide frint-muted">
                            Form type
                        </p>
                        <p className="mt-1 text-sm font-semibold capitalize text-[var(--frint-text)]">
                            {formatLabel(campaign.form_type)}
                        </p>
                    </div>

                    {campaign.form_type === 'custom_form' ? (
                        <div className="mt-3 space-y-2">
                            {formSchema.length === 0 ? (
                                <EmptyState
                                    title="No custom fields"
                                    message="This campaign has custom form selected but no fields saved."
                                />
                            ) : (
                                formSchema.map((field, index) => (
                                    <div
                                        key={field.id || index}
                                        className="rounded-[16px] border frint-border p-3"
                                    >
                                        <p className="text-sm font-semibold text-[var(--frint-text)]">
                                            {field.label || `Field ${index + 1}`}
                                        </p>
                                        <p className="mt-0.5 text-xs frint-muted">
                                            {field.type} {field.required ? '• required' : ''}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <p className="mt-3 text-sm font-medium frint-muted">
                            This campaign uses a predefined Frint form.
                        </p>
                    )}
                </section>
            </div>

            <section className="frint-card mt-4 rounded-[24px] p-4 sm:p-5">
                <div>
                    <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                        Campaign leads
                    </h2>
                    <p className="mt-0.5 text-sm frint-muted">
                        {leads.length} submissions from this campaign
                    </p>
                </div>

                {leads.length === 0 ? (
                    <div className="mt-4">
                        <EmptyState
                            title="No leads yet"
                            message="Share referral links to collect leads."
                        />
                    </div>
                ) : (
                    <>
                        <div className="mt-4 grid gap-3 lg:hidden">
                            {leads.map((lead) => {
                                const ambassador = getAmbassadorById(lead.ambassador_id)
                                const customAnswers = lead.raw_answers?.custom_answers || {}

                                return (
                                    <article
                                        key={lead.id}
                                        className="rounded-[18px] border frint-border p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-[var(--frint-text)]">
                                                    {lead.student_name || 'Unnamed'}
                                                </p>
                                                <p className="mt-0.5 text-xs frint-muted">
                                                    {lead.phone || 'No phone'}
                                                    {lead.email ? ` • ${lead.email}` : ''}
                                                </p>
                                            </div>

                                            <StatusBadge status={lead.status} />
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-[14px] bg-[var(--frint-soft-card)] p-2">
                                                <p className="font-semibold frint-muted">Ambassador</p>
                                                <p className="mt-0.5 truncate text-[var(--frint-text)]">
                                                    {ambassador?.full_name || ambassador?.email || 'Unknown'}
                                                </p>
                                            </div>

                                            <div className="rounded-[14px] bg-[var(--frint-soft-card)] p-2">
                                                <p className="font-semibold frint-muted">College</p>
                                                <p className="mt-0.5 truncate text-[var(--frint-text)]">
                                                    {lead.colleges?.name || 'Not selected'}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-3 text-xs frint-muted">
                                            {lead.course || 'Course not added'}
                                            {lead.year ? ` • ${lead.year}` : ''}
                                        </p>
                                        <p className="mt-1 text-xs frint-muted">
                                            {lead.interest || 'Interest not added'}
                                        </p>

                                        <CustomAnswers answers={customAnswers} />

                                        <select
                                            value={lead.status || 'new'}
                                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                            className="frint-input mt-3"
                                        >
                                            <option value="new">New</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="registered">Registered</option>
                                            <option value="converted">Converted</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </article>
                                )
                            })}
                        </div>

                        <div className="frint-table-wrap mt-4 hidden rounded-[18px] border frint-border lg:block">
                            <table className="w-full min-w-[980px] text-left">
                                <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase frint-muted">Student</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase frint-muted">Ambassador</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase frint-muted">College</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase frint-muted">Details</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase frint-muted">Status</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase frint-muted">Update</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {leads.map((lead) => {
                                        const ambassador = getAmbassadorById(lead.ambassador_id)
                                        const customAnswers = lead.raw_answers?.custom_answers || {}

                                        return (
                                            <tr key={lead.id} className="border-b frint-border last:border-b-0">
                                                <td className="px-4 py-4 align-top">
                                                    <p className="font-semibold text-[var(--frint-text)]">
                                                        {lead.student_name || 'Unnamed'}
                                                    </p>
                                                    <p className="mt-1 text-sm frint-muted">
                                                        {lead.phone || 'No phone'}
                                                    </p>
                                                    {lead.email && (
                                                        <p className="mt-1 text-sm frint-muted">
                                                            {lead.email}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 align-top text-sm font-medium frint-muted">
                                                    {ambassador?.full_name || ambassador?.email || 'Unknown'}
                                                </td>

                                                <td className="px-4 py-4 align-top text-sm font-medium frint-muted">
                                                    {lead.colleges?.name || 'Not selected'}
                                                </td>

                                                <td className="px-4 py-4 align-top">
                                                    <p className="text-sm font-medium frint-muted">
                                                        {lead.course || 'Course not added'}
                                                        {lead.year ? ` • ${lead.year}` : ''}
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium frint-muted">
                                                        {lead.interest || 'Interest not added'}
                                                    </p>

                                                    <CustomAnswers answers={customAnswers} />
                                                </td>

                                                <td className="px-4 py-4 align-top">
                                                    <StatusBadge status={lead.status} />
                                                </td>

                                                <td className="px-4 py-4 align-top">
                                                    <select
                                                        value={lead.status || 'new'}
                                                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                                        className="rounded-full border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-medium outline-none"
                                                    >
                                                        <option value="new">New</option>
                                                        <option value="contacted">Contacted</option>
                                                        <option value="registered">Registered</option>
                                                        <option value="converted">Converted</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>
        </DashboardLayout>
    )
}
