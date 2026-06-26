import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw, Search } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

function getCustomAnswers(lead) {
    const answers = lead?.raw_answers?.custom_answers

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        return {}
    }

    return answers
}

function formatKey(key) {
    return String(key || '')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatValue(value) {
    if (value === true) return 'Yes'
    if (value === false) return 'No'
    if (value === null || value === undefined || value === '') return 'Not answered'

    if (Array.isArray(value)) {
        return value.join(', ')
    }

    if (typeof value === 'object') {
        return JSON.stringify(value)
    }

    return String(value)
}

function formatCustomAnswers(lead) {
    const answers = getCustomAnswers(lead)

    return Object.entries(answers)
        .map(([key, value]) => `${formatKey(key)}: ${formatValue(value)}`)
        .join(' | ')
}

function LeadMobileCard({ lead, onStatusChange }) {
    const customAnswers = getCustomAnswers(lead)
    const hasCustomAnswers = Object.keys(customAnswers).length > 0

    return (
        <article className="rounded-[20px] border frint-border bg-[var(--frint-card)] p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-[16px] font-semibold text-[var(--frint-text)]">
                        {lead.student_name || 'Unnamed'}
                    </h3>
                    <p className="mt-0.5 truncate text-sm font-medium frint-muted">
                        {lead.phone || lead.email || 'No contact added'}
                    </p>
                </div>

                <StatusBadge status={lead.status} />
            </div>

            <div className="mt-3 grid gap-2 text-sm">
                <div className="rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide frint-muted">
                        Campaign
                    </p>
                    <p className="mt-0.5 truncate font-semibold text-[var(--frint-text)]">
                        {lead.campaigns?.title || 'Unknown'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0 rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide frint-muted">
                            Ambassador
                        </p>
                        <p className="mt-0.5 truncate font-semibold text-[var(--frint-text)]">
                            {lead.profiles?.full_name || lead.profiles?.email || 'Unknown'}
                        </p>
                    </div>

                    <div className="min-w-0 rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide frint-muted">
                            College
                        </p>
                        <p className="mt-0.5 truncate font-semibold text-[var(--frint-text)]">
                            {lead.colleges?.name || 'Not selected'}
                        </p>
                    </div>
                </div>
            </div>

            {(lead.interest || lead.course || lead.year || lead.city || lead.email) && (
                <div className="mt-3 space-y-1 text-sm font-medium frint-muted">
                    {lead.email && <p className="break-words">Email: {lead.email}</p>}
                    {lead.interest && <p>Interest: {lead.interest}</p>}
                    {lead.course && <p>Course: {lead.course}</p>}
                    {lead.year && <p>Year: {lead.year}</p>}
                    {lead.city && <p>City: {lead.city}</p>}
                </div>
            )}

            {hasCustomAnswers && (
                <details className="mt-3 rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2">
                    <summary className="cursor-pointer text-sm font-semibold text-[var(--frint-text)]">
                        Custom answers
                    </summary>

                    <div className="mt-2 space-y-1 text-sm font-medium frint-muted">
                        {Object.entries(customAnswers).map(([key, value]) => (
                            <p key={key} className="break-words">
                                <span className="font-semibold text-[var(--frint-text)]">
                                    {formatKey(key)}:
                                </span>{' '}
                                {formatValue(value)}
                            </p>
                        ))}
                    </div>
                </details>
            )}

            <select
                value={lead.status || 'new'}
                onChange={(e) => onStatusChange(lead.id, e.target.value)}
                className="frint-input mt-3"
            >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="registered">Registered</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
            </select>
        </article>
    )
}

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
        form_type,
        raw_answers,
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
            const customText = formatCustomAnswers(lead).toLowerCase()

            return (
                lead.student_name?.toLowerCase().includes(value) ||
                lead.phone?.toLowerCase().includes(value) ||
                lead.email?.toLowerCase().includes(value) ||
                lead.campaigns?.title?.toLowerCase().includes(value) ||
                lead.profiles?.full_name?.toLowerCase().includes(value) ||
                lead.profiles?.email?.toLowerCase().includes(value) ||
                lead.colleges?.name?.toLowerCase().includes(value) ||
                lead.interest?.toLowerCase().includes(value) ||
                customText.includes(value)
            )
        })
    }, [leads, search])

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
            <section className="frint-card rounded-[24px] p-4 sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                            Lead list
                        </h2>
                        <p className="mt-0.5 text-sm frint-muted">
                            {filteredLeads.length} records
                        </p>
                    </div>

                    <div className="grid gap-2 sm:flex sm:items-center">
                        <div className="flex min-w-0 items-center gap-2 rounded-full border frint-border bg-[var(--frint-card)] px-3 py-2">
                            <Search size={16} className="shrink-0 frint-muted" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search leads"
                                className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 sm:w-64"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex">
                            <button
                                type="button"
                                onClick={exportCsv}
                                className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                            >
                                <Download size={15} />
                                Export
                            </button>

                            <button
                                type="button"
                                onClick={loadLeads}
                                className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                            >
                                <RefreshCw size={15} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="mt-4 rounded-[20px] border frint-border p-6 text-center text-sm font-medium frint-muted">
                        Loading leads...
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="mt-4">
                        <EmptyState
                            title="No leads yet"
                            message="Share a referral link and submit the public form."
                        />
                    </div>
                ) : (
                    <>
                        <div className="mt-4 grid gap-3 md:hidden">
                            {filteredLeads.map((lead) => (
                                <LeadMobileCard
                                    key={lead.id}
                                    lead={lead}
                                    onStatusChange={updateLeadStatus}
                                />
                            ))}
                        </div>

                        <div className="mt-4 hidden overflow-hidden rounded-[22px] border frint-border md:block">
                            <div className="frint-table-wrap">
                                <table className="w-full min-w-[980px] text-left text-sm">
                                    <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">Student</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">Campaign</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">Ambassador</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">College</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">Details</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">Status</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">Update</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredLeads.map((lead) => {
                                            const customAnswers = getCustomAnswers(lead)
                                            const hasCustomAnswers = Object.keys(customAnswers).length > 0

                                            return (
                                                <tr key={lead.id} className="border-b frint-border align-top last:border-b-0">
                                                    <td className="px-4 py-3">
                                                        <p className="font-semibold text-[var(--frint-text)]">
                                                            {lead.student_name || 'Unnamed'}
                                                        </p>
                                                        <p className="mt-0.5 text-sm frint-muted">
                                                            {lead.phone || 'No phone'}
                                                        </p>
                                                        {lead.email && (
                                                            <p className="mt-0.5 max-w-[220px] truncate text-sm frint-muted">
                                                                {lead.email}
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 font-medium frint-muted">
                                                        {lead.campaigns?.title || 'Unknown'}
                                                    </td>

                                                    <td className="px-4 py-3 font-medium frint-muted">
                                                        {lead.profiles?.full_name || lead.profiles?.email || 'Unknown'}
                                                    </td>

                                                    <td className="px-4 py-3 font-medium frint-muted">
                                                        {lead.colleges?.name || 'Not selected'}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="space-y-1 font-medium frint-muted">
                                                            {lead.interest && <p>Interest: {lead.interest}</p>}
                                                            {lead.course && <p>Course: {lead.course}</p>}
                                                            {lead.year && <p>Year: {lead.year}</p>}
                                                            {lead.city && <p>City: {lead.city}</p>}
                                                            {!lead.interest && !lead.course && !lead.year && !lead.city && !hasCustomAnswers && <p>Not added</p>}
                                                        </div>

                                                        {hasCustomAnswers && (
                                                            <details className="mt-2 rounded-2xl bg-[var(--frint-soft-card)] p-3">
                                                                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide frint-muted">
                                                                    Custom answers
                                                                </summary>
                                                                <div className="mt-2 space-y-1">
                                                                    {Object.entries(customAnswers).map(([key, value]) => (
                                                                        <p key={key} className="text-sm font-medium frint-muted">
                                                                            <span className="font-semibold text-[var(--frint-text)]">
                                                                                {formatKey(key)}:
                                                                            </span>{' '}
                                                                            {formatValue(value)}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </details>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={lead.status} />
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={lead.status || 'new'}
                                                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                                            className="rounded-2xl border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-medium outline-none"
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
                        </div>
                    </>
                )}
            </section>
        </DashboardLayout>
    )
}
