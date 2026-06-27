import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Building2,
  Flag,
  Megaphone,
  RefreshCw,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { supabase } from '../../lib/supabase'

function compactNumber(value) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(value || 0)
}

function percent(value) {
  return `${Math.min(Number(value || 0), 100)}%`
}

function MetricChiclet({ label, value, helper, icon: Icon }) {
  return (
    <div className="frint-card rounded-[20px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold frint-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--frint-text)]">
            {compactNumber(value)}
          </p>
          {helper && (
            <p className="mt-1 truncate text-[12px] font-medium frint-muted">
              {helper}
            </p>
          )}
        </div>

        <span className="frint-icon-chip shrink-0">
          <Icon size={18} />
        </span>
      </div>
    </div>
  )
}

function ProgressRow({ title, current, target, progress }) {
  return (
    <div className="rounded-[17px] border frint-border bg-[var(--frint-card)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--frint-text)]">
            {title || 'Untitled campaign'}
          </p>
          <p className="text-xs font-medium frint-muted">
            {current || 0}/{target || 0} leads
          </p>
        </div>
        <p className="text-xs font-semibold frint-muted">{percent(progress)}</p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
        <div
          className="h-full rounded-full bg-[var(--frint-accent)]"
          style={{ width: percent(progress) }}
        />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    ambassadors: 0,
    colleges: 0,
    campaigns: 0,
    leads: 0,
    newLeads: 0,
    registered: 0,
    converted: 0,
    pendingProofs: 0,
  })
  const [campaignProgress, setCampaignProgress] = useState([])
  const [topAmbassadors, setTopAmbassadors] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [message, setMessage] = useState('')

  const loadDashboard = async () => {
    setRefreshing(true)
    setMessage('')

    const [
      ambassadorsResult,
      collegesResult,
      campaignsResult,
      leadsResult,
      newLeadsResult,
      registeredResult,
      convertedResult,
      proofsResult,
      progressResult,
      leaderboardResult,
      recentLeadsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'ambassador'),
      supabase.from('colleges').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'registered'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'converted'),
      supabase.from('task_assignments').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('campaign_progress').select('*').limit(5),
      supabase.from('ambassador_leaderboard').select('*').limit(3),
      supabase
        .from('leads')
        .select(`
          id,
          student_name,
          phone,
          status,
          created_at,
          campaigns ( title ),
          profiles ( full_name, email )
        `)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const possibleError = [
      ambassadorsResult,
      collegesResult,
      campaignsResult,
      leadsResult,
      newLeadsResult,
      registeredResult,
      convertedResult,
      proofsResult,
      progressResult,
      leaderboardResult,
      recentLeadsResult,
    ].find((result) => result.error)

    if (possibleError?.error) {
      setMessage(possibleError.error.message)
    }

    setStats({
      ambassadors: ambassadorsResult.count || 0,
      colleges: collegesResult.count || 0,
      campaigns: campaignsResult.count || 0,
      leads: leadsResult.count || 0,
      newLeads: newLeadsResult.count || 0,
      registered: registeredResult.count || 0,
      converted: convertedResult.count || 0,
      pendingProofs: proofsResult.count || 0,
    })

    setCampaignProgress(progressResult.data || [])
    setTopAmbassadors(leaderboardResult.data || [])
    setRecentLeads(recentLeadsResult.data || [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const conversionRate = useMemo(() => {
    if (!stats.leads) return 0
    return Math.round((stats.converted / stats.leads) * 100)
  }, [stats])

  return (
    <DashboardLayout
      role="admin"
      title="Admin Dashboard"
      subtitle="Live overview of campaigns, leads, proofs, and ambassadors"
    >
      <div className="space-y-4 lg:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="frint-kicker">Control room</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--frint-text)]">
              Today at a glance
            </h2>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={refreshing}
            className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm sm:w-auto"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {message && (
          <div className="rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
            {message}
          </div>
        )}

        <div className="frint-chiclet-grid">
          <MetricChiclet label="Ambassadors" value={stats.ambassadors} helper="Total members" icon={UsersRound} />
          <MetricChiclet label="Colleges" value={stats.colleges} helper="Active campuses" icon={Building2} />
          <MetricChiclet label="Campaigns" value={stats.campaigns} helper="Running now" icon={Megaphone} />
          <MetricChiclet label="Leads" value={stats.leads} helper="Collected so far" icon={Flag} />
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="frint-card rounded-[22px] p-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--frint-text)]">
                  Campaign progress
                </h3>
                <p className="mt-0.5 text-sm frint-muted">
                  Lead collection against targets
                </p>
              </div>
              <span className="frint-icon-chip">
                <Megaphone size={18} />
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {loading ? (
                <p className="text-sm frint-muted">Loading progress...</p>
              ) : campaignProgress.length === 0 ? (
                <p className="text-sm frint-muted">No campaigns found yet.</p>
              ) : (
                campaignProgress.map((campaign) => (
                  <ProgressRow
                    key={campaign.campaign_id}
                    title={campaign.title}
                    current={campaign.total_leads}
                    target={campaign.target_count}
                    progress={campaign.progress_percent}
                  />
                ))
              )}
            </div>
          </div>

          <div className="frint-card rounded-[22px] p-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--frint-text)]">
                  Performance snapshot
                </h3>
                <p className="mt-0.5 text-sm frint-muted">
                  Compact conversion summary
                </p>
              </div>
              <span className="frint-icon-chip">
                <Activity size={18} />
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-[17px] bg-[var(--frint-soft-card)] p-3">
                <p className="text-xs font-semibold frint-muted">New</p>
                <p className="mt-1 text-xl font-semibold text-[var(--frint-text)]">{stats.newLeads}</p>
              </div>
              <div className="rounded-[17px] bg-[var(--frint-soft-card)] p-3">
                <p className="text-xs font-semibold frint-muted">Registered</p>
                <p className="mt-1 text-xl font-semibold text-[var(--frint-text)]">{stats.registered}</p>
              </div>
              <div className="rounded-[17px] bg-[var(--frint-soft-card)] p-3">
                <p className="text-xs font-semibold frint-muted">Converted</p>
                <p className="mt-1 text-xl font-semibold text-[var(--frint-text)]">{stats.converted}</p>
              </div>
              <div className="rounded-[17px] bg-[var(--frint-soft-card)] p-3">
                <p className="text-xs font-semibold frint-muted">Rate</p>
                <p className="mt-1 text-xl font-semibold text-[var(--frint-text)]">{conversionRate}%</p>
              </div>
            </div>

            <div className="mt-3 rounded-[17px] bg-[var(--frint-soft-card)] p-3">
              <p className="text-xs font-semibold frint-muted">Pending proof review</p>
              <p className="mt-1 text-xl font-semibold text-[var(--frint-text)]">{stats.pendingProofs}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="frint-card rounded-[22px] p-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--frint-text)]">
                  Top ambassadors
                </h3>
                <p className="mt-0.5 text-sm frint-muted">Based on points and leads</p>
              </div>
              <span className="frint-icon-chip">
                <Trophy size={18} />
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {topAmbassadors.length === 0 ? (
                <p className="text-sm frint-muted">No ranking data yet.</p>
              ) : (
                topAmbassadors.map((ambassador, index) => (
                  <div key={ambassador.ambassador_id} className="flex items-center gap-3 rounded-[17px] bg-[var(--frint-soft-card)] p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--frint-card)] text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--frint-text)]">
                        {ambassador.full_name || ambassador.email || 'Ambassador'}
                      </p>
                      <p className="truncate text-xs frint-muted">
                        {ambassador.college_name || 'No college'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--frint-text)]">{ambassador.total_points || 0}</p>
                      <p className="text-xs frint-muted">points</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="frint-card rounded-[22px] p-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--frint-text)]">
                  Recent leads
                </h3>
                <p className="mt-0.5 text-sm frint-muted">Latest student submissions</p>
              </div>
              <span className="frint-icon-chip">
                <UserRound size={18} />
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {recentLeads.length === 0 ? (
                <p className="text-sm frint-muted">No leads submitted yet.</p>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="rounded-[17px] bg-[var(--frint-soft-card)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--frint-text)]">
                          {lead.student_name || 'Unnamed student'}
                        </p>
                        <p className="truncate text-xs frint-muted">
                          {lead.campaigns?.title || 'Unknown campaign'}
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--frint-card)] px-2.5 py-1 text-[11px] font-semibold capitalize frint-muted">
                        {lead.status || 'new'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
