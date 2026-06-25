import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    ArrowLeft,
    Copy,
    Link2,
    Loader2,
    Megaphone,
    Plus,
    RefreshCw,
    Target,
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
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (value === null || value === undefined || value === '') return 'Not answered'
    if (typeof value === 'object') return JSON.stringify(value)

    return String(value)
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
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
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

    if (loading) {
        return (
            <DashboardLayout
                role="admin"
                title="Campaign Details"
                subtitle="Loading campaign"
            >
                <div className="frint-card flex items-center justify-center gap-3 rounded-[30px] p-8">
                    <Loader2 className="animate-spin text-[#0060f8]" size={22} />
                    <p className="text-sm font-black frint-muted">Loading campaign...</p>
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

    return (
        <DashboardLayout
            role="admin"
            title="Campaign Details"
            subtitle={campaign.title}
        >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    to="/admin/campaigns"
                    className="frint-secondary-btn flex w-fit items-center gap-2 px-5 py-2.5 text-sm"
                >
                    <ArrowLeft size={16} />
                    Back to campaigns
                </Link>

                <button
                    onClick={loadData}
                    className="frint-secondary-btn flex w-fit items-center gap-2 px-5 py-2.5 text-sm"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {message && (
                <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {message}
                </div>
            )}

            <section className="frint-card rounded-[30px] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-3xl font-black text-[var(--frint-text)]">
                                {campaign.title}
                            </h1>
                            <StatusBadge status={campaign.status} />
                        </div>

                        <p className="mt-3 text-sm font-bold capitalize frint-muted">
                            {formatLabel(campaign.type)} • {formatLabel(campaign.action_mode)} • {formatLabel(campaign.form_type)}
                        </p>

                        {campaign.description && (
                            <p className="mt-4 max-w-3xl text-sm font-bold leading-6 frint-muted">
                                {campaign.description}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                            value={campaign.status || 'draft'}
                            onChange={(e) => updateCampaignStatus(e.target.value)}
                            disabled={savingStatus}
                            className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none disabled:opacity-60"
                        >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[24px] bg-[var(--frint-soft-card)] p-5">
                        <div className="flex items-center gap-2 text-[#0060f8]">
                            <Target size={18} />
                            <p className="text-sm font-black">Progress</p>
                        </div>
                        <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                            {progress?.total_leads || 0}/{campaign.target_count || 0}
                        </p>
                    </div>

                    <div className="rounded-[24px] bg-[var(--frint-soft-card)] p-5">
                        <div className="flex items-center gap-2 text-[#0060f8]">
                            <Users size={18} />
                            <p className="text-sm font-black">Assigned</p>
                        </div>
                        <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                            {assignments.length}
                        </p>
                    </div>

                    <div className="rounded-[24px] bg-[var(--frint-soft-card)] p-5">
                        <p className="text-sm font-black frint-muted">Registered</p>
                        <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                            {progress?.registered_leads || 0}
                        </p>
                    </div>

                    <div className="rounded-[24px] bg-[var(--frint-soft-card)] p-5">
                        <p className="text-sm font-black frint-muted">Converted</p>
                        <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                            {progress?.converted_leads || 0}
                        </p>
                    </div>
                </div>

                <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs font-black frint-muted">
                        <span>Campaign progress</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>

                    <div className="h-[5px] overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
                        <div
                            className="h-full rounded-full bg-[#0060f8]"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
                <section className="frint-card rounded-[30px] p-6">
                    <div className="flex items-center gap-3">
                        <Megaphone className="text-[#0060f8]" size={24} />
                        <div>
                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                Assigned ambassadors
                            </h2>
                            <p className="text-sm frint-muted">
                                Referral links and ambassador targets
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
                        <p className="mb-3 text-sm font-black text-[var(--frint-text)]">
                            Add ambassador
                        </p>

                        {activeUnassignedAmbassadors.length === 0 ? (
                            <p className="text-sm font-bold frint-muted">
                                All active ambassadors are already assigned to this campaign.
                            </p>
                        ) : (
                            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.8fr_auto]">
                                <select
                                    value={assignmentForm.ambassador_id}
                                    onChange={(e) =>
                                        setAssignmentForm({
                                            ...assignmentForm,
                                            ambassador_id: e.target.value,
                                        })
                                    }
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
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
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
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
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                />

                                <button
                                    type="button"
                                    disabled={assigning}
                                    onClick={assignAmbassador}
                                    className="frint-primary-btn flex items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60"
                                >
                                    <Plus size={16} />
                                    {assigning ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 space-y-3">
                        {assignments.length === 0 ? (
                            <EmptyState
                                title="No ambassadors assigned"
                                message="Assign ambassadors to generate referral links."
                            />
                        ) : (
                            assignments.map((assignment) => {
                                const ambassador = getAmbassadorById(assignment.ambassador_id)
                                const link = `${window.location.origin}/c/${assignment.ref_code}`

                                return (
                                    <div
                                        key={assignment.id}
                                        className="rounded-[22px] border frint-border p-4"
                                    >
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <p className="font-black text-[var(--frint-text)]">
                                                    {ambassador?.full_name || ambassador?.email || 'Ambassador'}
                                                </p>

                                                <p className="mt-1 text-sm frint-muted">
                                                    Target {assignment.target_count || 0}
                                                    {assignment.deadline ? ` • Deadline ${assignment.deadline}` : ''}
                                                </p>

                                                <p className="mt-2 break-all text-sm font-bold frint-muted">
                                                    {link}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => copyReferralLink(assignment.ref_code)}
                                                className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                                            >
                                                <Copy size={15} />
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </section>

                <section className="frint-card rounded-[30px] p-6">
                    <div className="flex items-center gap-3">
                        <Link2 className="text-[#0060f8]" size={24} />
                        <div>
                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                Campaign form
                            </h2>
                            <p className="text-sm frint-muted">
                                Fields used on public referral form
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 rounded-[24px] bg-[var(--frint-soft-card)] p-4">
                        <p className="text-sm font-black text-[var(--frint-text)]">
                            Form type
                        </p>
                        <p className="mt-1 text-sm font-bold capitalize frint-muted">
                            {formatLabel(campaign.form_type)}
                        </p>
                    </div>

                    {campaign.form_type === 'custom_form' ? (
                        <div className="mt-4 space-y-3">
                            {formSchema.length === 0 ? (
                                <EmptyState
                                    title="No custom fields"
                                    message="This campaign has custom form selected but no fields saved."
                                />
                            ) : (
                                formSchema.map((field, index) => (
                                    <div
                                        key={field.id || index}
                                        className="rounded-[20px] border frint-border p-4"
                                    >
                                        <p className="font-black text-[var(--frint-text)]">
                                            {field.label || `Field ${index + 1}`}
                                        </p>
                                        <p className="mt-1 text-sm font-bold frint-muted">
                                            {field.type} • key: {field.name || 'not_set'}
                                            {field.required ? ' • required' : ''}
                                        </p>

                                        {field.options?.length > 0 && (
                                            <p className="mt-2 text-sm frint-muted">
                                                Options: {field.options.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <p className="mt-4 text-sm font-bold frint-muted">
                            This campaign uses a predefined Frint form.
                        </p>
                    )}
                </section>
            </div>

            <div className="mt-6">
                <CampaignSettingsEditor
                    campaign={campaign}
                    onUpdated={loadData}
                />
            </div>

            <section className="frint-card mt-6 rounded-[30px] p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[var(--frint-text)]">
                            Campaign leads
                        </h2>
                        <p className="mt-1 text-sm frint-muted">
                            {leads.length} submissions from this campaign
                        </p>
                    </div>
                </div>

                <div className="mt-5 rounded-[24px] border frint-border">
                    {leads.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                title="No leads yet"
                                message="Share referral links to collect leads."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[1100px] w-full text-left">
                                <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                    <tr>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Student</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Ambassador</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">College</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Details</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Status</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Update</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {leads.map((lead) => {
                                        const ambassador = getAmbassadorById(lead.ambassador_id)
                                        const customAnswers = lead.raw_answers?.custom_answers || {}

                                        return (
                                            <tr key={lead.id} className="border-b frint-border last:border-b-0">
                                                <td className="px-4 py-4 align-top">
                                                    <p className="font-black text-[var(--frint-text)]">
                                                        {lead.student_name}
                                                    </p>
                                                    <p className="mt-1 text-sm frint-muted">
                                                        {lead.phone}
                                                    </p>
                                                    {lead.email && (
                                                        <p className="mt-1 text-sm frint-muted">
                                                            {lead.email}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 align-top text-sm font-bold frint-muted">
                                                    {ambassador?.full_name || ambassador?.email || 'Unknown'}
                                                </td>

                                                <td className="px-4 py-4 align-top text-sm font-bold frint-muted">
                                                    {lead.colleges?.name || 'Not selected'}
                                                </td>

                                                <td className="px-4 py-4 align-top">
                                                    <p className="text-sm font-bold frint-muted">
                                                        {lead.course || 'Course not added'}
                                                        {lead.year ? ` • ${lead.year}` : ''}
                                                    </p>
                                                    <p className="mt-1 text-sm font-bold frint-muted">
                                                        {lead.interest || 'Interest not added'}
                                                    </p>

                                                    {Object.keys(customAnswers).length > 0 && (
                                                        <div className="mt-3 rounded-[18px] bg-[var(--frint-soft-card)] p-3">
                                                            <p className="mb-2 text-xs font-black uppercase tracking-wide frint-muted">
                                                                Custom answers
                                                            </p>

                                                            <div className="space-y-1">
                                                                {Object.entries(customAnswers).map(([key, value]) => (
                                                                    <p key={key} className="text-sm font-bold frint-muted">
                                                                        <span className="font-black capitalize text-[var(--frint-text)]">
                                                                            {key.replaceAll('_', ' ')}:
                                                                        </span>{' '}
                                                                        {formatCustomValue(value)}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 align-top">
                                                    <StatusBadge status={lead.status} />
                                                </td>

                                                <td className="px-4 py-4 align-top">
                                                    <select
                                                        value={lead.status}
                                                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-bold outline-none"
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
                    )}
                </div>
            </section>
        </DashboardLayout>
    )
}