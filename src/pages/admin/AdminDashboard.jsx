import { useEffect, useState } from 'react'
import {
  Building2,
  ClipboardCheck,
  Flag,
  Megaphone,
  RefreshCw,
  Trophy,
  Users,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    ambassadors: 0,
    colleges: 0,
    campaigns: 0,
    leads: 0,
    pendingProofs: 0,
  })

  const [campaigns, setCampaigns] = useState([])
  const [topAmbassador, setTopAmbassador] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    setMessage('')

    const [
      ambassadorsCount,
      collegesCount,
      campaignsCount,
      leadsCount,
      pendingProofsCount,
      campaignProgress,
      leaderboard,
      tasksResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'ambassador'),

      supabase
        .from('colleges')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      supabase
        .from('campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true }),

      supabase
        .from('task_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'submitted'),

      supabase
        .from('campaign_progress')
        .select('*')
        .order('total_leads', { ascending: false })
        .limit(4),

      supabase
        .from('ambassador_leaderboard')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(1),

      supabase
        .from('tasks')
        .select(`
          id,
          title,
          points,
          status,
          due_date,
          campaigns (
            id,
            title
          ),
          task_assignments (
            id,
            status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(4),
    ])

    const errors = [
      ambassadorsCount.error,
      collegesCount.error,
      campaignsCount.error,
      leadsCount.error,
      pendingProofsCount.error,
      campaignProgress.error,
      leaderboard.error,
      tasksResult.error,
    ].filter(Boolean)

    if (errors.length > 0) {
      setMessage(errors[0].message)
    }

    setStats({
      ambassadors: ambassadorsCount.count || 0,
      colleges: collegesCount.count || 0,
      campaigns: campaignsCount.count || 0,
      leads: leadsCount.count || 0,
      pendingProofs: pendingProofsCount.count || 0,
    })

    setCampaigns(campaignProgress.data || [])
    setTopAmbassador(leaderboard.data?.[0] || null)
    setRecentTasks(tasksResult.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const statCards = [
    {
      title: 'Ambassadors',
      value: stats.ambassadors,
      note: 'Total members',
      icon: Users,
    },
    {
      title: 'Colleges',
      value: stats.colleges,
      note: 'Active campuses',
      icon: Building2,
    },
    {
      title: 'Campaigns',
      value: stats.campaigns,
      note: 'Running now',
      icon: Megaphone,
    },
    {
      title: 'Leads',
      value: stats.leads,
      note: 'Collected so far',
      icon: Flag,
    },
  ]

  return (
    <DashboardLayout
      role="admin"
      title="Admin Dashboard"
      subtitle="Live overview of campaigns, leads, proofs, and ambassadors"
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
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
                  <Icon size={22} />
                </div>

                <span className="rounded-full bg-[var(--frint-soft-card)] px-3 py-1 text-xs font-black frint-muted">
                  Live
                </span>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <section className="frint-card rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[var(--frint-text)]">
                Campaign progress
              </h2>
              <p className="mt-1 text-sm frint-muted">
                Lead collection against campaign targets
              </p>
            </div>

            <Megaphone className="text-[#0060f8]" size={24} />
          </div>

          <div className="mt-6 space-y-5">
            {campaigns.length === 0 ? (
              <EmptyState
                title="No campaign data"
                message="Create campaigns and collect leads to see progress."
              />
            ) : (
              campaigns.map((campaign) => {
                const percent = Math.min(Number(campaign.progress_percent || 0), 100)

                return (
                  <div key={campaign.campaign_id}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-[var(--frint-text)]">
                          {campaign.title}
                        </p>
                        <p className="mt-1 text-xs font-bold frint-muted">
                          {campaign.total_leads || 0}/{campaign.target_count || 0} leads
                        </p>
                      </div>

                      <span className="text-sm font-black frint-muted">
                        {Math.round(percent)}%
                      </span>
                    </div>

                    <div className="h-[5px] overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
                      <div
                        className="h-full rounded-full bg-[#0060f8]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="frint-card rounded-[30px] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
              <Trophy size={21} />
            </div>

            <div>
              <h2 className="text-xl font-black text-[var(--frint-text)]">
                Top ambassador
              </h2>
              <p className="text-sm frint-muted">Based on points</p>
            </div>
          </div>

          {topAmbassador ? (
            <div className="mt-6 rounded-[24px] bg-[var(--frint-soft-card)] p-5">
              <p className="text-2xl font-black text-[var(--frint-text)]">
                {topAmbassador.full_name || 'Unnamed ambassador'}
              </p>

              <p className="mt-1 text-sm frint-muted">
                {topAmbassador.college_name || topAmbassador.email}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#0060f8] px-4 py-3 text-white">
                  <span className="text-xs font-bold">Points</span>
                  <p className="mt-1 text-2xl font-black">
                    {topAmbassador.total_points || 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-[var(--frint-card)] px-4 py-3">
                  <span className="text-xs font-bold frint-muted">Leads</span>
                  <p className="mt-1 text-2xl font-black text-[var(--frint-text)]">
                    {topAmbassador.total_leads || 0}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No ranking yet"
              message="Approve proof or add points to show top ambassador."
            />
          )}
        </section>
      </div>

      <section className="frint-card mt-6 rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[var(--frint-text)]">
              Recent tasks
            </h2>
            <p className="mt-1 text-sm frint-muted">
              Latest assigned work and proof status
            </p>
          </div>

          <ClipboardCheck className="text-[#0060f8]" size={24} />
        </div>

        <div className="mt-5 space-y-3">
          {recentTasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              message="Create tasks for ambassadors to start tracking proof."
            />
          ) : (
            recentTasks.map((task) => {
              const submittedCount =
                task.task_assignments?.filter((item) => item.status === 'submitted').length || 0

              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-[22px] border frint-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black text-[var(--frint-text)]">
                      {task.title}
                    </p>
                    <p className="mt-1 text-sm frint-muted">
                      {task.campaigns?.title || 'No campaign'} • {task.points} points
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black frint-muted">
                      {submittedCount} submitted
                    </span>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {stats.pendingProofs > 0 && (
          <div className="mt-5 rounded-[22px] bg-blue-50 px-4 py-3 text-sm font-black text-[#0060f8]">
            {stats.pendingProofs} proof submission pending for review.
          </div>
        )}
      </section>
    </DashboardLayout>
  )
}