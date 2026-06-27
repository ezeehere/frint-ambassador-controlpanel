import { useEffect, useState } from 'react'
import { Copy, Loader2, RefreshCw, Target, Users } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

function getLabel(value) {
    return value?.replaceAll('_', ' ') || 'campaign'
}

function formatDate(value) {
    if (!value) return 'No deadline'

    return new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export default function MyCampaigns() {
    const [assignments, setAssignments] = useState([])
    const [leadCounts, setLeadCounts] = useState({})
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

    const loadData = async () => {
        setLoading(true)
        setMessage('')

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
            setMessage('Could not load user.')
            setLoading(false)
            return
        }

        const assignmentResult = await supabase
            .from('ambassador_campaigns')
            .select(`
        id,
        ref_code,
        status,
        target_count,
        deadline,
        points_per_lead,
        points_per_conversion,
        assigned_at,
        campaigns (
          id,
          title,
          description,
          type,
          action_mode,
          form_type,
          status,
          target_count,
          start_date,
          end_date
        )
      `)
            .eq('ambassador_id', user.id)
            .order('assigned_at', { ascending: false })

        if (assignmentResult.error) {
            setMessage(assignmentResult.error.message)
            setLoading(false)
            return
        }

        const leadResult = await supabase
            .from('leads')
            .select('id, campaign_id, status')
            .eq('ambassador_id', user.id)

        if (leadResult.error) {
            setMessage(leadResult.error.message)
            setLoading(false)
            return
        }

        const counts = {}

        for (const lead of leadResult.data || []) {
            if (!counts[lead.campaign_id]) {
                counts[lead.campaign_id] = {
                    total: 0,
                    converted: 0,
                    registered: 0,
                }
            }

            counts[lead.campaign_id].total += 1

            if (lead.status === 'converted') counts[lead.campaign_id].converted += 1
            if (lead.status === 'registered') counts[lead.campaign_id].registered += 1
        }

        setAssignments(assignmentResult.data || [])
        setLeadCounts(counts)
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    const copyLink = async (refCode) => {
        const link = `${window.location.origin}/c/${refCode}`
        await navigator.clipboard.writeText(link)
        alert('Referral link copied')
    }

    return (
        <DashboardLayout
            role="ambassador"
            title="My Campaigns"
            subtitle="Referral links and assigned targets"
        >
            {message && (
                <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {message}
                </div>
            )}

            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[var(--frint-text)]">
                        Assigned campaigns
                    </p>
                    <p className="text-xs frint-muted">
                        Copy links, share them, and track your leads.
                    </p>
                </div>

                <button
                    onClick={loadData}
                    className="frint-secondary-btn flex items-center gap-2 px-3 py-2 text-sm"
                >
                    <RefreshCw size={15} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>

            {loading ? (
                <div className="frint-card flex items-center justify-center gap-3 rounded-[24px] p-6">
                    <Loader2 className="animate-spin text-[var(--frint-accent)]" size={20} />
                    <p className="text-sm font-medium frint-muted">Loading campaigns...</p>
                </div>
            ) : assignments.length === 0 ? (
                <EmptyState
                    title="No campaigns assigned"
                    message="Once Frint assigns a campaign, it will appear here."
                />
            ) : (
                <div className="grid gap-3">
                    {assignments.map((assignment) => {
                        const campaign = assignment.campaigns
                        const counts = leadCounts[campaign?.id] || {
                            total: 0,
                            converted: 0,
                            registered: 0,
                        }

                        const target = assignment.target_count || campaign?.target_count || 0
                        const percent = target > 0 ? Math.min((counts.total / target) * 100, 100) : 0

                        return (
                            <section
                                key={assignment.id}
                                className="frint-card rounded-[24px] p-4"
                            >
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="truncate text-lg font-semibold text-[var(--frint-text)]">
                                                {campaign?.title || 'Campaign'}
                                            </h2>
                                            <StatusBadge status={assignment.status} />
                                        </div>

                                        <p className="mt-1 text-sm capitalize frint-muted">
                                            {getLabel(campaign?.type)} • {getLabel(campaign?.action_mode)}
                                        </p>

                                        {campaign?.description && (
                                            <p className="mt-2 line-clamp-2 text-sm frint-muted">
                                                {campaign.description}
                                            </p>
                                        )}

                                        <p className="mt-2 text-xs font-medium frint-muted">
                                            Deadline: {formatDate(assignment.deadline || campaign?.end_date)}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => copyLink(assignment.ref_code)}
                                        className="frint-primary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm lg:shrink-0"
                                    >
                                        <Copy size={15} />
                                        Copy link
                                    </button>
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    <div className="min-w-0 rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                                        <div className="flex items-center gap-1.5 text-[var(--frint-accent)]">
                                            <Users size={14} />
                                            <p className="truncate text-[11px] font-medium">Leads</p>
                                        </div>
                                        <p className="mt-1 text-lg font-semibold text-[var(--frint-text)]">
                                            {counts.total}
                                        </p>
                                    </div>

                                    <div className="min-w-0 rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                                        <div className="flex items-center gap-1.5 text-[var(--frint-accent)]">
                                            <Target size={14} />
                                            <p className="truncate text-[11px] font-medium">Target</p>
                                        </div>
                                        <p className="mt-1 text-lg font-semibold text-[var(--frint-text)]">
                                            {target}
                                        </p>
                                    </div>

                                    <div className="min-w-0 rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                                        <p className="truncate text-[11px] font-medium frint-muted">
                                            Converted
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-[var(--frint-text)]">
                                            {counts.converted}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="mb-1 flex items-center justify-between text-[11px] font-medium frint-muted">
                                        <span>Progress</span>
                                        <span>{Math.round(percent)}%</span>
                                    </div>

                                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
                                        <div
                                            className="h-full rounded-full bg-[var(--frint-accent)]"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 rounded-2xl border frint-border bg-[var(--frint-soft-card)] px-3 py-2">
                                    <p className="text-[11px] font-medium frint-muted">
                                        Referral code
                                    </p>
                                    <p className="mt-0.5 truncate text-sm font-semibold text-[var(--frint-text)]">
                                        {assignment.ref_code}
                                    </p>
                                </div>
                            </section>
                        )
                    })}
                </div>
            )}
        </DashboardLayout>
    )
}
