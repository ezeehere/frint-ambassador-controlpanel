import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, RefreshCw } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

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
        link.download = selectedCampaign ? 'frint-campaign-report.csv' : 'frint-all-leads-report.csv'
        link.click()

        URL.revokeObjectURL(url)
    }

    return (
        <DashboardLayout
            role="admin"
            title="Reports"
            subtitle="Export and review campaign performance"
        >
            <section className="frint-card rounded-[30px] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
                            <FileText size={21} />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                Campaign report
                            </h2>
                            <p className="text-sm frint-muted">
                                Leads, conversion, colleges, ambassadors
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                            value={selectedCampaign}
                            onChange={(e) => setSelectedCampaign(e.target.value)}
                            className="rounded-full border frint-border bg-[var(--frint-card)] px-4 py-2.5 text-sm font-bold outline-none"
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
                            className="frint-secondary-btn flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>

                        <button
                            onClick={exportCsv}
                            className="frint-primary-btn flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="mt-5 rounded-[24px] border frint-border p-8 text-center text-sm font-bold frint-muted">
                        Loading reports...
                    </div>
                ) : (
                    <>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            <div className="rounded-[24px] bg-[var(--frint-soft-card)] p-5">
                                <p className="text-sm font-black frint-muted">Total leads</p>
                                <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                                    {summary.total}
                                </p>
                            </div>

                            <div className="rounded-[24px] bg-[var(--frint-soft-card)] p-5">
                                <p className="text-sm font-black frint-muted">New</p>
                                <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                                    {summary.newCount}
                                </p>
                            </div>

                            <div className="rounded-[24px] bg-[var(--frint-soft-card)] p-5">
                                <p className="text-sm font-black frint-muted">Registered</p>
                                <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                                    {summary.registered}
                                </p>
                            </div>

                            <div className="rounded-[24px] bg-[var(--frint-soft-card)] p-5">
                                <p className="text-sm font-black frint-muted">Converted</p>
                                <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                                    {summary.converted}
                                </p>
                            </div>

                            <div className="rounded-[24px] bg-[var(--frint-soft-card)] p-5">
                                <p className="text-sm font-black frint-muted">Rejected</p>
                                <p className="mt-2 text-3xl font-black text-[var(--frint-text)]">
                                    {summary.rejected}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-[24px] border frint-border p-5">
                                <p className="text-sm font-black frint-muted">Top college</p>
                                <p className="mt-2 text-xl font-black text-[var(--frint-text)]">
                                    {summary.topCollege?.[0] || 'No data'}
                                </p>
                                <p className="mt-1 text-sm font-bold frint-muted">
                                    {summary.topCollege?.[1] || 0} leads
                                </p>
                            </div>

                            <div className="rounded-[24px] border frint-border p-5">
                                <p className="text-sm font-black frint-muted">Top ambassador</p>
                                <p className="mt-2 text-xl font-black text-[var(--frint-text)]">
                                    {summary.topAmbassador?.[0] || 'No data'}
                                </p>
                                <p className="mt-1 text-sm font-bold frint-muted">
                                    {summary.topAmbassador?.[1] || 0} leads
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 rounded-[24px] border frint-border">
                            {filteredLeads.length === 0 ? (
                                <div className="p-5">
                                    <EmptyState
                                        title="No leads in this report"
                                        message="Choose another campaign or collect new leads."
                                    />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-[980px] w-full text-left">
                                        <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                            <tr>
                                                <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Student</th>
                                                <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Campaign</th>
                                                <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Ambassador</th>
                                                <th className="px-4 py-4 text-xs font-black uppercase frint-muted">College</th>
                                                <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Status</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredLeads.map((lead) => (
                                                <tr key={lead.id} className="border-b frint-border last:border-b-0">
                                                    <td className="px-4 py-4">
                                                        <p className="font-black text-[var(--frint-text)]">
                                                            {lead.student_name}
                                                        </p>
                                                        <p className="mt-1 text-sm frint-muted">
                                                            {lead.phone}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 text-sm font-bold frint-muted">
                                                        {lead.campaigns?.title || 'Unknown'}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm font-bold frint-muted">
                                                        {lead.profiles?.full_name || lead.profiles?.email || 'Unknown'}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm font-bold frint-muted">
                                                        {lead.colleges?.name || 'Not selected'}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm font-black capitalize text-[var(--frint-text)]">
                                                        {lead.status}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>
        </DashboardLayout>
    )
}