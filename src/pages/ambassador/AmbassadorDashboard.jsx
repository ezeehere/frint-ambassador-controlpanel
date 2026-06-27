import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardCheck,
  Copy,
  Flag,
  Link2,
  Megaphone,
  RefreshCw,
  Trophy,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import { supabase } from '../../lib/supabase'

function makeReferralLink(refCode) {
  return `${window.location.origin}/c/${refCode}`
}

function formatDate(value) {
  if (!value) return 'No deadline'

  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AmbassadorDashboard() {
  const [profile, setProfile] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [leads, setLeads] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [points, setPoints] = useState(0)
  const [rank, setRank] = useState('-')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadDashboard = async () => {
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

    const [
      profileResult,
      assignmentsResult,
      leadsResult,
      taskAssignmentsResult,
      pointsResult,
      leaderboardResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          colleges (
            id,
            name
          )
        `)
        .eq('id', user.id)
        .maybeSingle(),

      supabase
        .from('ambassador_campaigns')
        .select(`
          id,
          ref_code,
          status,
          target_count,
          deadline,
          campaigns (
            id,
            title,
            description,
            type,
            action_mode,
            status
          )
        `)
        .eq('ambassador_id', user.id)
        .eq('status', 'active')
        .order('assigned_at', { ascending: false }),

      supabase
        .from('leads')
        .select('id, status, campaign_id')
        .eq('ambassador_id', user.id),

      supabase
        .from('task_assignments')
        .select(`
          id,
          status,
          points_awarded,
          tasks (
            id,
            title,
            points,
            due_date,
            campaigns (
              id,
              title
            )
          )
        `)
        .eq('ambassador_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase
        .from('points_log')
        .select('points')
        .eq('ambassador_id', user.id),

      supabase
        .from('ambassador_leaderboard')
        .select('ambassador_id, total_points, total_leads')
        .order('total_points', { ascending: false })
        .order('total_leads', { ascending: false }),
    ])

    const errors = [
      profileResult.error,
      assignmentsResult.error,
      leadsResult.error,
      taskAssignmentsResult.error,
      pointsResult.error,
      leaderboardResult.error,
    ].filter(Boolean)

    if (errors.length > 0) {
      setMessage(errors[0].message)
    }

    const pointTotal = (pointsResult.data || []).reduce((sum, item) => {
      return sum + Number(item.points || 0)
    }, 0)

    const rankIndex = (leaderboardResult.data || []).findIndex(
      (item) => item.ambassador_id === user.id
    )

    setProfile(profileResult.data || null)
    setAssignments(assignmentsResult.data || [])
    setLeads(leadsResult.data || [])
    setRecentTasks(taskAssignmentsResult.data || [])
    setPoints(pointTotal)
    setRank(rankIndex >= 0 ? rankIndex + 1 : '-')
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const activeCampaign = assignments[0] || null

  const leadCountsByCampaign = useMemo(() => {
    const map = {}

    for (const lead of leads) {
      if (!map[lead.campaign_id]) {
        map[lead.campaign_id] = {
          total: 0,
          converted: 0,
          registered: 0,
        }
      }

      map[lead.campaign_id].total += 1

      if (lead.status === 'converted') {
        map[lead.campaign_id].converted += 1
      }

      if (lead.status === 'registered') {
        map[lead.campaign_id].registered += 1
      }
    }

    return map
  }, [leads])

  const activeCampaignId = activeCampaign?.campaigns?.id
  const activeCampaignLeads = leadCountsByCampaign[activeCampaignId]?.total || 0
  const activeCampaignTarget = activeCampaign?.target_count || 0
  const activeProgress =
    activeCampaignTarget > 0
      ? Math.min((activeCampaignLeads / activeCampaignTarget) * 100, 100)
      : 0

  const pendingTasks = recentTasks.filter((item) =>
    ['pending', 'submitted'].includes(item.status)
  ).length

  const statCards = [
    {
      label: 'Leads',
      value: leads.length,
      note: 'Collected by you',
      icon: Flag,
    },
    {
      label: 'Campaigns',
      value: assignments.length,
      note: 'Active assigned',
      icon: Megaphone,
    },
    {
      label: 'Tasks',
      value: pendingTasks,
      note: 'Need attention',
      icon: ClipboardCheck,
    },
    {
      label: 'Points',
      value: points,
      note: `Rank ${rank}`,
      icon: Trophy,
    },
  ]

  const copyLink = async (refCode) => {
    await navigator.clipboard.writeText(makeReferralLink(refCode))
    alert('Referral link copied')
  }

  return (
    <DashboardLayout
      role="ambassador"
      title="My Dashboard"
      subtitle={
        profile?.full_name
          ? `Welcome, ${profile.full_name}`
          : 'Campaigns, tasks, leads and points'
      }
    >
      {message && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {message}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--frint-text)]">
            Today’s workspace
          </p>
          <p className="text-xs frint-muted">
            Focus on links, tasks and proof uploads.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="frint-secondary-btn flex items-center gap-2 px-3 py-2 text-sm"
        >
          <RefreshCw size={15} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon

          return (
            <section
              key={item.label}
              className="frint-card rounded-[20px] p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium frint-muted">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--frint-text)]">
                    {loading ? '...' : item.value}
                  </p>
                </div>

                <span className="frint-icon-chip h-9 w-9 rounded-2xl">
                  <Icon size={16} />
                </span>
              </div>

              <p className="mt-2 truncate text-[11px] font-medium frint-muted">
                {item.note}
              </p>
            </section>
          )
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="frint-card rounded-[24px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                Next campaign to share
              </h2>
              <p className="text-sm frint-muted">
                Your latest active referral link
              </p>
            </div>

            <Link2 className="text-[var(--frint-accent)]" size={20} />
          </div>

          {!activeCampaign ? (
            <div className="mt-4">
              <EmptyState
                title="No active campaign"
                message="Assigned campaigns will appear here."
              />
            </div>
          ) : (
            <div className="mt-4 rounded-[22px] border frint-border bg-[var(--frint-soft-card)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-semibold text-[var(--frint-text)]">
                      {activeCampaign.campaigns?.title || 'Campaign'}
                    </h3>
                    <StatusBadge status={activeCampaign.status} />
                  </div>

                  <p className="mt-1 text-sm capitalize frint-muted">
                    {activeCampaign.campaigns?.type?.replaceAll('_', ' ') || 'Campaign'}
                  </p>

                  <p className="mt-2 text-xs font-medium frint-muted">
                    Deadline: {formatDate(activeCampaign.deadline)}
                  </p>
                </div>

                <button
                  onClick={() => copyLink(activeCampaign.ref_code)}
                  className="frint-primary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                >
                  <Copy size={15} />
                  Copy link
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-[var(--frint-card)] px-3 py-2">
                  <p className="text-[11px] frint-muted">Leads</p>
                  <p className="text-lg font-semibold">{activeCampaignLeads}</p>
                </div>
                <div className="rounded-2xl bg-[var(--frint-card)] px-3 py-2">
                  <p className="text-[11px] frint-muted">Target</p>
                  <p className="text-lg font-semibold">{activeCampaignTarget}</p>
                </div>
                <div className="rounded-2xl bg-[var(--frint-card)] px-3 py-2">
                  <p className="text-[11px] frint-muted">Progress</p>
                  <p className="text-lg font-semibold">{Math.round(activeProgress)}%</p>
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--frint-card)]">
                <div
                  className="h-full rounded-full bg-[var(--frint-accent)]"
                  style={{ width: `${activeProgress}%` }}
                />
              </div>
            </div>
          )}
        </section>

        <section className="frint-card rounded-[24px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                Leaderboard
              </h2>
              <p className="text-sm frint-muted">
                Your current standing
              </p>
            </div>

            <Trophy className="text-[var(--frint-accent)]" size={20} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[20px] bg-[var(--frint-soft-card)] p-4">
              <p className="text-xs font-medium frint-muted">Rank</p>
              <p className="mt-1 text-3xl font-semibold tracking-[-0.05em]">
                {rank}
              </p>
            </div>

            <div className="rounded-[20px] bg-[var(--frint-soft-card)] p-4">
              <p className="text-xs font-medium frint-muted">Points</p>
              <p className="mt-1 text-3xl font-semibold tracking-[-0.05em]">
                {points}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="frint-card mt-4 rounded-[24px] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--frint-text)]">
              Recent tasks
            </h2>
            <p className="text-sm frint-muted">
              Proofs and assignments from Frint
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5">
          {recentTasks.length === 0 ? (
            <EmptyState
              title="No tasks assigned"
              message="Tasks assigned by Frint will appear here."
            />
          ) : (
            recentTasks.map((assignment) => (
              <article
                key={assignment.id}
                className="rounded-[18px] border frint-border bg-[var(--frint-soft-card)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--frint-text)]">
                      {assignment.tasks?.title || 'Task'}
                    </p>
                    <p className="mt-1 truncate text-xs frint-muted">
                      {assignment.tasks?.campaigns?.title || 'No campaign'} • {assignment.tasks?.points || 0} points
                    </p>
                  </div>

                  <StatusBadge status={assignment.status} />
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </DashboardLayout>
  )
}
