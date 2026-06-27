import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, RefreshCw } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import { supabase } from '../../lib/supabase'

function getCustomAnswers(lead) {
    const answers = lead?.raw_answers?.custom_answers

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        return {}
    }

    return answers
}

function formatCustomAnswers(lead) {
    const answers = getCustomAnswers(lead)

    return Object.entries(answers)
        .map(([key, value]) => `${key.replaceAll('_', ' ')}: ${String(value)}`)
        .join(' | ')
}

function formatDate(value) {
    if (!value) return 'Not available'

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value))
}

function ReportMetric({ label, value }) {
    return (
        <div className="rounded-[18px] border frint-border bg-[var(--frint-soft-card)] px-4 py-3">
            <p className="text-[12px] font-semibold frint-muted">{label}</p>
            <p className="mt-1 text-[24px] font-semibold leading-none text-[var(--frint-text)]">
                {value}
            </p>
        </div>
    )
}

function ReportLeadCard({ lead }) {
    return (
        <article className="rounded-[18px] border frint-border bg-[var(--frint-card)] p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-[var(--frint-text)]">
                        {lead.student_name || 'Unnamed student'}
                    </h3>
                    <p className="mt-0.5 truncate text-[13px] frint-muted">
                        {lead.phone || lead.email || 'No contact added'}
                    </p>
                </div>

                <StatusBadge status={lead.status || 'new'} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                <div className="rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                    <p className="font-medium frint-muted">Campaign</p>
                    <p className="mt-0.5 truncate font-semibold text-[var(--frint-text)]">
                        {lead.campaigns?.title || 'Unknown'}
                    </p>
                </div>

                <div className="rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                    <p className="font-medium frint-muted">Ambassador</p>
                    <p className="mt-0.5 truncate font-semibold text-[var(--frint-text)]">
                        {lead.profiles?.full_name || lead.profiles?.email || 'Unknown'}
                    </p>
                </div>

                <div className="rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                    <p className="font-medium frint-muted">College</p>
                    <p className="mt-0.5 truncate font-semibold text-[var(--frint-text)]">
                        {lead.colleges?.name || 'Not selected'}
                    </p>
                </div>

                <div className="rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                    <p className="font-medium frint-muted">Submitted</p>
                    <p className="mt-0.5 truncate font-semibold text-[var(--frint-text)]">
                        {formatDate(lead.created_at)}
                    </p>
                </div>
            </div>
        </article>
    )
}

export default function Reports() {
    const [campaigns, setCampaigns] = useState([])
    const [leads, setLeads] = useState([])
    const [selectedCampaign, setSelectedCampaign] = useState('')
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

    const loadData = async () => {
        setLoading(true)
        setMessage('')

        const campaignsResult = await supabase
            .from('campaigns')
            .select('id, title, type, status')
            .order('created_at', { ascending: false })

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
        created_at,
        form_type,
        raw_answers,
        campaigns (
          id,
          title,
          type
        ),
        profiles (
          id,
          full_name,
          email
        ),
        colleges (
          id,
          name,
          city
        )
      `)
            .order('created_at', { ascending: false })

        if (campaignsResult.error) setMessage(campaignsResult.error.message)
        if (leadsResult.error) setMessage(leadsResult.error.message)

        setCampaigns(campaignsResult.data || [])
        setLeads(leadsResult.data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredLeads = useMemo(() => {
        if (!selectedCampaign) return leads
        return leads.filter((lead) => lead.campaigns?.id === selectedCampaign)
    }, [leads, selectedCampaign])

    const selectedCampaignName = useMemo(() => {
        if (!selectedCampaign) return 'All campaigns'
        return campaigns.find((campaign) => campaign.id === selectedCampaign)?.title || 'Selected campaign'
    }, [campaigns, selectedCampaign])

    const summary = useMemo(() => {
        const total = filteredLeads.length
        const newCount = filteredLeads.filter((lead) => lead.status === 'new').length
        const registered = filteredLeads.filter((lead) => lead.status === 'registered').length
        const converted = filteredLeads.filter((lead) => lead.status === 'converted').length
        const rejected = filteredLeads.filter((lead) => lead.status === 'rejected').length

        const collegeMap = new Map()
        const ambassadorMap = new Map()

        for (const lead of filteredLeads) {
            const college = lead.colleges?.name || 'Not selected'
            const ambassador = lead.profiles?.full_name || lead.profiles?.email || 'Unknown'

            collegeMap.set(college, (collegeMap.get(college) || 0) + 1)
            ambassadorMap.set(ambassador, (ambassadorMap.get(ambassador) || 0) + 1)
        }

        const topCollege = [...collegeMap.entries()].sort((a, b) => b[1] - a[1])[0]
        const topAmbassador = [...ambassadorMap.entries()].sort((a, b) => b[1] - a[1])[0]

        return {
            total,
            newCount,
            registered,
            converted,
            rejected,
            topCollege,
            topAmbassador,
        }
    }, [filteredLeads])

    const exportCsv = () => {
        const headers = [
            'Student Name',
            'Phone',
            'Email',
            'College',
            'Course',
            'Year',
            'City',
            'Interest',
            'Campaign',
            'Campaign Type',
            'Ambassador',
            'Status',
            'Custom Answers',
            'Created At',
        ]

        const rows = filteredLeads.map((lead) => [
            lead.student_name || '',
            lead.phone || '',
            lead.email || '',
            lead.colleges?.name || '',
            lead.course || '',
            lead.year || '',
            lead.city || '',
            lead.interest || '',
            lead.campaigns?.title || '',
            lead.campaigns?.type || '',
            lead.profiles?.full_name || lead.profiles?.email || '',
            lead.status || '',
            formatCustomAnswers(lead),
            lead.created_at || '',
        ])

        const csv = [headers, ...rows]
            .map((row) =>
                row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')
            )
            .join('\n')

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = selectedCampaign
            ? 'frint-campaign-report.csv'
            : 'frint-all-leads-report.csv'
        link.click()

        URL.revokeObjectURL(url)
    }

    return (
        <DashboardLayout
            role="admin"
            title="Reports"
            subtitle="Export and review campaign performance"
        >
            <section className="space-y-4">
                <div className="frint-card rounded-[24px] p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="frint-icon-chip">
                                <FileText size={19} />
                            </div>

                            <div className="min-w-0">
                                <h2 className="truncate text-lg font-semibold text-[var(--frint-text)]">
                                    Campaign report
                                </h2>
                                <p className="text-sm frint-muted">
                                    {selectedCampaignName}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2 sm:flex sm:items-center">
                            <select
                                value={selectedCampaign}
                                onChange={(e) => setSelectedCampaign(e.target.value)}
                                className="frint-input min-h-10 rounded-full py-2 text-sm sm:w-56"
                            >
                                <option value="">All campaigns</option>
                                {campaigns.map((campaign) => (
                                    <option key={campaign.id} value={campaign.id}>
                                        {campaign.title}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={loadData}
                                className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                            >
                                <RefreshCw size={15} />
                                Refresh
                            </button>

                            <button
                                onClick={exportCsv}
                                disabled={filteredLeads.length === 0}
                                className="frint-primary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
                            >
                                <Download size={15} />
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                            {message}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="frint-card rounded-[22px] p-6 text-center text-sm font-medium frint-muted">
                        Loading reports...
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                            <ReportMetric label="Total leads" value={summary.total} />
                            <ReportMetric label="New" value={summary.newCount} />
                            <ReportMetric label="Registered" value={summary.registered} />
                            <ReportMetric label="Converted" value={summary.converted} />
                            <ReportMetric label="Rejected" value={summary.rejected} />
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                            <div className="frint-card rounded-[22px] p-4">
                                <p className="text-[12px] font-semibold frint-muted">Top college</p>
                                <p className="mt-1 truncate text-[17px] font-semibold text-[var(--frint-text)]">
                                    {summary.topCollege?.[0] || 'No data'}
                                </p>
                                <p className="mt-0.5 text-sm frint-muted">
                                    {summary.topCollege?.[1] || 0} leads
                                </p>
                            </div>

                            <div className="frint-card rounded-[22px] p-4">
                                <p className="text-[12px] font-semibold frint-muted">Top ambassador</p>
                                <p className="mt-1 truncate text-[17px] font-semibold text-[var(--frint-text)]">
                                    {summary.topAmbassador?.[0] || 'No data'}
                                </p>
                                <p className="mt-0.5 text-sm frint-muted">
                                    {summary.topAmbassador?.[1] || 0} leads
                                </p>
                            </div>
                        </div>

                        <div className="frint-card rounded-[24px] p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                                        Lead records
                                    </h2>
                                    <p className="text-sm frint-muted">
                                        {filteredLeads.length} rows in this report
                                    </p>
                                </div>
                            </div>

                            {filteredLeads.length === 0 ? (
                                <div className="mt-4">
                                    <EmptyState
                                        title="No leads in this report"
                                        message="Choose another campaign or collect new leads."
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="mt-4 grid gap-3 md:hidden">
                                        {filteredLeads.map((lead) => (
                                            <ReportLeadCard key={lead.id} lead={lead} />
                                        ))}
                                    </div>

                                    <div className="mt-4 hidden overflow-hidden rounded-[20px] border frint-border md:block">
                                        <table className="w-full text-left">
                                            <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase frint-muted">
                                                        Student
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase frint-muted">
                                                        Campaign
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase frint-muted">
                                                        Ambassador
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase frint-muted">
                                                        College
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-semibold uppercase frint-muted">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {filteredLeads.map((lead) => (
                                                    <tr key={lead.id} className="border-b frint-border last:border-b-0">
                                                        <td className="px-4 py-3">
                                                            <p className="font-semibold text-[var(--frint-text)]">
                                                                {lead.student_name || 'Unnamed'}
                                                            </p>
                                                            <p className="mt-0.5 text-sm frint-muted">
                                                                {lead.phone || lead.email || 'No contact'}
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-3 text-sm font-medium frint-muted">
                                                            {lead.campaigns?.title || 'Unknown'}
                                                        </td>

                                                        <td className="px-4 py-3 text-sm font-medium frint-muted">
                                                            {lead.profiles?.full_name || lead.profiles?.email || 'Unknown'}
                                                        </td>

                                                        <td className="px-4 py-3 text-sm font-medium frint-muted">
                                                            {lead.colleges?.name || 'Not selected'}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <StatusBadge status={lead.status || 'new'} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </section>
        </DashboardLayout>
    )
}
