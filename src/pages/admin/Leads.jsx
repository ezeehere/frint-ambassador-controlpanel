import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw, Search } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

export default function Leads() {
    const [leads, setLeads] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

    const loadLeads = async () => {
        setLoading(true)
        setMessage('')

        const result = await supabase
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
          title
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

        if (result.error) {
            setMessage(result.error.message)
            setLoading(false)
            return
        }

        setLeads(result.data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadLeads()
    }, [])

    const filteredLeads = useMemo(() => {
        const value = search.trim().toLowerCase()

        if (!value) return leads

        return leads.filter((lead) => {
            return (
                lead.student_name?.toLowerCase().includes(value) ||
                lead.phone?.toLowerCase().includes(value) ||
                lead.email?.toLowerCase().includes(value) ||
                lead.campaigns?.title?.toLowerCase().includes(value) ||
                lead.profiles?.full_name?.toLowerCase().includes(value) ||
                lead.colleges?.name?.toLowerCase().includes(value)
            )
        })
    }, [leads, search])

    const updateLeadStatus = async (leadId, status) => {
        const result = await supabase
            .from('leads')
            .update({ status })
            .eq('id', leadId)

        if (result.error) {
            setMessage(result.error.message)
            return
        }

        await loadLeads()
    }

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
            lead.profiles?.full_name || lead.profiles?.email || '',
            lead.status || '',
            lead.created_at || '',
        ])

        const csv = [headers, ...rows]
            .map((row) =>
                row
                    .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
                    .join(',')
            )
            .join('\n')

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = 'frint-leads.csv'
        link.click()

        URL.revokeObjectURL(url)
    }

    return (
        <DashboardLayout
            role="admin"
            title="Leads"
            subtitle="Track student leads from referral links"
        >
            <section className="frint-card rounded-[30px] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[var(--frint-text)]">
                            Lead list
                        </h2>
                        <p className="mt-1 text-sm frint-muted">
                            {filteredLeads.length} records
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex items-center gap-2 rounded-full border frint-border bg-[var(--frint-card)] px-4 py-2.5">
                            <Search size={17} className="frint-muted" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search leads"
                                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 sm:w-64"
                            />
                        </div>

                        <button
                            onClick={exportCsv}
                            className="frint-secondary-btn flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
                        >
                            <Download size={16} />
                            Export
                        </button>

                        <button
                            onClick={loadLeads}
                            className="frint-secondary-btn flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {message}
                    </div>
                )}

                <div className="mt-5 rounded-[24px] border frint-border">
                    {loading ? (
                        <div className="p-8 text-center text-sm font-bold frint-muted">
                            Loading leads...
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                title="No leads yet"
                                message="Share a referral link and submit the public form."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[1100px] w-full text-left">
                                <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                    <tr>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Student</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Campaign</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Ambassador</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">College</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Interest</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Status</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Update</th>
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
                                                {lead.email && (
                                                    <p className="mt-1 text-sm frint-muted">
                                                        {lead.email}
                                                    </p>
                                                )}
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

                                            <td className="px-4 py-4 text-sm font-bold frint-muted">
                                                {lead.interest || 'Not added'}
                                            </td>

                                            <td className="px-4 py-4">
                                                <StatusBadge status={lead.status} />
                                            </td>

                                            <td className="px-4 py-4">
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </DashboardLayout>
    )
}