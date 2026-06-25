import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

export default function MyLeads() {
    const [leads, setLeads] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

    const loadLeads = async () => {
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
        raw_answers,
        form_type,
        created_at,
        campaigns (
          id,
          title
        ),
        colleges (
          id,
          name,
          city
        )
      `)
            .eq('ambassador_id', user.id)
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
                lead.colleges?.name?.toLowerCase().includes(value)
            )
        })
    }, [leads, search])

    return (
        <DashboardLayout
            role="ambassador"
            title="My Leads"
            subtitle="Students submitted through your links"
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
                                message="Share your referral link. Submitted students will appear here."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[900px] w-full text-left">
                                <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                    <tr>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Student</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Campaign</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">College</th>
                                        <th className="px-4 py-4 text-xs font-black uppercase frint-muted">Interest</th>
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
                                                {lead.email && (
                                                    <p className="mt-1 text-sm frint-muted">
                                                        {lead.email}
                                                    </p>
                                                )}

                                                {lead.form_type === 'custom_form' &&
                                                    lead.raw_answers?.custom_answers &&
                                                    Object.keys(lead.raw_answers.custom_answers).length > 0 && (
                                                        <div className="mt-3 rounded-[18px] bg-[var(--frint-soft-card)] p-3">
                                                            <p className="mb-2 text-xs font-black uppercase tracking-wide frint-muted">
                                                                Custom answers
                                                            </p>

                                                            <div className="space-y-1">
                                                                {Object.entries(lead.raw_answers.custom_answers).map(([key, value]) => (
                                                                    <p key={key} className="text-sm font-bold frint-muted">
                                                                        <span className="font-black capitalize text-[var(--frint-text)]">
                                                                            {key.replaceAll('_', ' ')}:
                                                                        </span>{' '}
                                                                        {String(value)}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                            </td>

                                            <td className="px-4 py-4 text-sm font-bold frint-muted">
                                                {lead.campaigns?.title || 'Unknown'}
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