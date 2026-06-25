import { useEffect, useState } from 'react'
import { Medal, RefreshCw, Trophy } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import { supabase } from '../lib/supabase'

export default function Leaderboard({ role = 'admin' }) {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

    const loadLeaderboard = async () => {
        setLoading(true)
        setMessage('')

        const result = await supabase
            .from('ambassador_leaderboard')
            .select('*')
            .order('total_points', { ascending: false })
            .order('total_leads', { ascending: false })

        if (result.error) {
            setMessage(result.error.message)
            setLoading(false)
            return
        }

        setRows(result.data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadLeaderboard()
    }, [])

    return (
        <DashboardLayout
            role={role}
            title="Leaderboard"
            subtitle="Rank ambassadors by points, leads, and approved work"
        >
            <section className="frint-card rounded-[30px] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
                            <Trophy size={22} />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                Ambassador rankings
                            </h2>
                            <p className="text-sm frint-muted">
                                {rows.length} ambassadors
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={loadLeaderboard}
                        className="frint-secondary-btn flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                {message && (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {message}
                    </div>
                )}

                <div className="mt-5">
                    {loading ? (
                        <div className="rounded-[24px] border frint-border p-8 text-center text-sm font-bold frint-muted">
                            Loading leaderboard...
                        </div>
                    ) : rows.length === 0 ? (
                        <EmptyState
                            title="No leaderboard data"
                            message="Approve proofs or add points to build rankings."
                        />
                    ) : (
                        <div className="overflow-hidden rounded-[24px] border frint-border">
                            <div className="overflow-x-auto">
                                <table className="min-w-[980px] w-full text-left">
                                    <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                        <tr>
                                            <th className="px-4 py-4 text-xs font-black uppercase frint-muted">
                                                Rank
                                            </th>
                                            <th className="px-4 py-4 text-xs font-black uppercase frint-muted">
                                                Ambassador
                                            </th>
                                            <th className="px-4 py-4 text-xs font-black uppercase frint-muted">
                                                College
                                            </th>
                                            <th className="px-4 py-4 text-xs font-black uppercase frint-muted">
                                                Points
                                            </th>
                                            <th className="px-4 py-4 text-xs font-black uppercase frint-muted">
                                                Leads
                                            </th>
                                            <th className="px-4 py-4 text-xs font-black uppercase frint-muted">
                                                Registered
                                            </th>
                                            <th className="px-4 py-4 text-xs font-black uppercase frint-muted">
                                                Converted
                                            </th>
                                            <th className="px-4 py-4 text-xs font-black uppercase frint-muted">
                                                Tasks
                                            </th>
                                            <th className="px-4 py-4 text-xs font-black uppercase frint-muted">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {rows.map((row, index) => (
                                            <tr key={row.ambassador_id} className="border-b frint-border last:border-b-0">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--frint-soft-card)] text-sm font-black text-[var(--frint-text)]">
                                                            {index + 1}
                                                        </div>
                                                        {index < 3 && <Medal size={18} className="text-[#0060f8]" />}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <p className="font-black text-[var(--frint-text)]">
                                                        {row.full_name || 'Unnamed ambassador'}
                                                    </p>
                                                    <p className="mt-1 text-sm frint-muted">
                                                        {row.email}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4 text-sm font-bold frint-muted">
                                                    {row.college_name || 'No college'}
                                                </td>

                                                <td className="px-4 py-4 text-2xl font-black text-[var(--frint-text)]">
                                                    {row.total_points || 0}
                                                </td>

                                                <td className="px-4 py-4 text-sm font-black text-[var(--frint-text)]">
                                                    {row.total_leads || 0}
                                                </td>

                                                <td className="px-4 py-4 text-sm font-black text-[var(--frint-text)]">
                                                    {row.registered_leads || 0}
                                                </td>

                                                <td className="px-4 py-4 text-sm font-black text-[var(--frint-text)]">
                                                    {row.converted_leads || 0}
                                                </td>

                                                <td className="px-4 py-4 text-sm font-black text-[var(--frint-text)]">
                                                    {row.approved_tasks || 0}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <StatusBadge status={row.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </DashboardLayout>
    )
}