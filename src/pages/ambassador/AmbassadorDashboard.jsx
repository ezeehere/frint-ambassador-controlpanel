import { useEffect, useState } from 'react'
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

export default function AmbassadorDashboard() {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    leads: 0,
    campaigns: 0,
    tasks: 0,
    points: 0,
    rank: '-',
  })
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])
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
        .limit(4),

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

    const points = (pointsResult.data || []).reduce((sum, item) => {
      return sum + Number(item.points || 0)
    }, 0)

    const rankIndex = (leaderboardResult.data || []).findIndex(
      (item) => item.ambassador_id === user.id
    )

    const assignments = assignmentsResult.data || []
    const leads = leadsResult.data || []
    const tasks = taskAssignmentsResult.data || []

    setProfile(profileResult.data || null)

    setStats({
      leads: leads.length,
      campaigns: assignments.length,
      tasks: tasks.filter((item) => item.status === 'pending' || item.status === 'submitted').length,
      points,
      rank: rankIndex >= 0 ? rankIndex + 1 : '-',
    })

    setActiveCampaign(assignments[0] || null)
    setRecentTasks(tasks)
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const copyLink = async (refCode) => {
    const link = `${window.location.origin}/c/${refCode}`
    await navigator.clipboard.writeText(link)
    alert('Referral link copied')
  }

  const campaignLeadCount = activeCampaign
    ? stats.leads
    : 0

  const campaignTarget = activeCampaign?.target_count || 0
  const progress =
    campaignTarget > 0 ? Math.min((campaignLeadCount / campaignTarget) * 100, 100) : 0

  const statCards = [
    {
      title: 'My leads',
      value: stats.leads,
      note: 'Students collected',
      icon: Flag,
    },
    {
      title: 'Campaigns',
      value: stats.campaigns,
      note: 'Assigned active',
      icon: Megaphone,
    },
    {
      title: 'Tasks',
      value: stats.tasks,
      note: 'Pending/submitted',
      icon: ClipboardCheck,
    },
    {
      title: 'Points',
      value: stats.points,
      note: `Rank ${stats.rank}`,
      icon: Trophy,
    },
  ]

  return (
    <DashboardLayout
      role="ambassador"
      title="My Dashboard"
      subtitle={
        profile?.full_name
          ? `Welcome, ${profile.full_name}`
          : 'Track campaigns, leads, tasks, and points'
      }
    >
      {message && (
        <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {message}
        </div>
      )}

      <div className="mb-5 flex justify-end">
        <button
          onClick={loadDashboard}
          className="frint-secondary-btn flex items-center gap-2 px-5 py-2.5 text-sm"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon

          return (
            <div key={item.title} className="frint-card rounded-[28px] p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
                <Icon size={22} />
              </div>

              <p className="mt-5 text-sm font-bold frint-muted">
                {item.title}
              </p>

              <p className="mt-1 text-4xl font-black text-[var(--frint-text)]">
                {loading ? '...' : item.value}
              </p>

              <p className="mt-2 text-sm frint-muted">
                {item.note}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        <section className="frint-card rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[var(--frint-text)]">
                Active campaign
              </h2>
              <p className="mt-1 text-sm frint-muted">
                Your latest assigned campaign
              </p>
            </div>

            <Link2 className="text-[#0060f8]" size={24} />
          </div>

          {!activeCampaign ? (
            <div className="mt-5">
              <EmptyState
                title="No active campaign"
                message="Frint campaigns assigned to you will appear here."
              />
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-[24px] bg-[var(--frint-soft-card)] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-[var(--frint-text)]">
                      {activeCampaign.campaigns?.title}
                    </h3>

                    <p className="mt-1 text-sm font-bold capitalize frint-muted">
                      {activeCampaign.campaigns?.type?.replaceAll('_', ' ')}
                    </p>
                  </div>

                  <StatusBadge status={activeCampaign.status} />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs font-black frint-muted">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>

                  <div className="h-[5px] overflow-hidden rounded-full bg-[var(--frint-card)]">
                    <div
                      className="h-full rounded-full bg-[#0060f8]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs font-bold frint-muted">
                    {campaignLeadCount}/{campaignTarget || 0} leads
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[22px] border frint-border bg-[var(--frint-soft-card)] p-4">
                <p className="text-xs font-black uppercase tracking-wide frint-muted">
                  Referral link
                </p>

                <p className="mt-2 break-all text-sm font-bold text-[var(--frint-text)]">
                  {`${window.location.origin}/c/${activeCampaign.ref_code}`}
                </p>

                <button
                  onClick={() => copyLink(activeCampaign.ref_code)}
                  className="frint-primary-btn mt-4 flex items-center justify-center gap-2 px-5 py-3 text-sm"
                >
                  <Copy size={16} />
                  Copy link
                </button>
              </div>
            </>
          )}
        </section>

        <section className="frint-card rounded-[30px] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
              <Trophy size={21} />
            </div>

            <div>
              <h2 className="text-xl font-black text-[var(--frint-text)]">
                My rank
              </h2>
              <p className="text-sm frint-muted">Leaderboard position</p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] bg-[#0060f8] p-6 text-white">
            <p className="text-sm font-bold text-white/75">Current rank</p>
            <p className="mt-2 text-6xl font-black">
              {stats.rank}
            </p>
            <p className="mt-3 text-sm font-bold text-white/80">
              {stats.points} total points
            </p>
          </div>
        </section>
      </div>

      <section className="frint-card mt-6 rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[var(--frint-text)]">
              Recent tasks
            </h2>
            <p className="mt-1 text-sm frint-muted">
              Your latest assigned tasks
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {recentTasks.length === 0 ? (
            <EmptyState
              title="No tasks assigned"
              message="Tasks assigned by Frint will appear here."
            />
          ) : (
            recentTasks.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-col gap-3 rounded-[22px] border frint-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-black text-[var(--frint-text)]">
                    {assignment.tasks?.title || 'Task'}
                  </p>
                  <p className="mt-1 text-sm frint-muted">
                    {assignment.tasks?.campaigns?.title || 'No campaign'} • {assignment.tasks?.points || 0} points
                  </p>
                </div>

                <StatusBadge status={assignment.status} />
              </div>
            ))
          )}
        </div>
      </section>
    </DashboardLayout>
  )
}