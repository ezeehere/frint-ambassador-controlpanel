import { useEffect, useState } from 'react'
import { Copy, Loader2, Target, Users } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

function getLabel(value) {
    return value?.replaceAll('_', ' ') || 'campaign'
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

            if (lead.status === 'converted') {
                counts[lead.campaign_id].converted += 1
            }

            if (lead.status === 'registered') {
                counts[lead.campaign_id].registered += 1
            }
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
            subtitle="View assigned campaigns and referral links"
        >
            {message && (
                <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {message}
                </div>
            )}

            {loading ? (
                <div className="frint-card flex items-center justify-center gap-3 rounded-[30px] p-8">
                    <Loader2 className="animate-spin text-[#0060f8]" size={22} />
                    <p className="text-sm font-black frint-muted">Loading campaigns...</p>
                </div>
            ) : assignments.length === 0 ? (
                <EmptyState
                    title="No campaigns assigned"
                    message="Once Frint assigns you a campaign, it will appear here."
                />
            ) : (
                <div className="grid gap-5">
                    {assignments.map((assignment) => {
                        const campaign = assignment.campaigns
                        const counts = leadCounts[campaign?.id] || {
                            total: 0,
                            converted: 0,
                            registered: 0,
                        }

                        const target = assignment.target_count || campaign?.target_count || 0
                        const percent = target > 0 ? Math.min((counts.total / target) * 100, 100) : 0
                        const referralLink = `${window.location.origin}/c/${assignment.ref_code}`

                        return (
                            <section key={assignment.id} className="frint-card rounded-[30px] p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                                {campaign?.title || 'Campaign'}
                                            </h2>
                                            <StatusBadge status={assignment.status} />
                                        </div>

                                        <p className="mt-2 text-sm font-bold capitalize frint-muted">
                                            {getLabel(campaign?.type)} • {getLabel(campaign?.action_mode)}
                                        </p>

                                        {campaign?.description && (
                                            <p className="mt-3 max-w-2xl text-sm font-bold frint-muted">
                                                {campaign.description}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => copyLink(assignment.ref_code)}
                                        className="frint-primary-btn flex items-center justify-center gap-2 px-5 py-3 text-sm"
                                    >
                                        <Copy size={16} />
                                        Copy link
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-[22px] bg-[var(--frint-soft-card)] p-4">
                                        <div className="flex items-center gap-2 text-[#0060f8]">
                                            <Users size={17} />
                                            <p className="text-sm font-black">Leads</p>
                                        </div>
                                        <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                                            {counts.total}
                                        </p>
                                    </div>

                                    <div className="rounded-[22px] bg-[var(--frint-soft-card)] p-4">
                                        <div className="flex items-center gap-2 text-[#0060f8]">
                                            <Target size={17} />
                                            <p className="text-sm font-black">Target</p>
                                        </div>
                                        <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                                            {target}
                                        </p>
                                    </div>

                                    <div className="rounded-[22px] bg-[var(--frint-soft-card)] p-4">
                                        <p className="text-sm font-black frint-muted">Converted</p>
                                        <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                                            {counts.converted}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <div className="mb-2 flex items-center justify-between text-xs font-black frint-muted">
                                        <span>Progress</span>
                                        <span>{Math.round(percent)}%</span>
                                    </div>

                                    <div className="h-[5px] overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
                                        <div
                                            className="h-full rounded-full bg-[#0060f8]"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 rounded-[22px] border frint-border bg-[var(--frint-soft-card)] p-4">
                                    <p className="text-xs font-black uppercase tracking-wide frint-muted">
                                        Referral link
                                    </p>
                                    <p className="mt-2 break-all text-sm font-bold text-[var(--frint-text)]">
                                        {referralLink}
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