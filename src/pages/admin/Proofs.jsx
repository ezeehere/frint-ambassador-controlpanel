import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, RefreshCw, XCircle } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

export default function Proofs() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [reviewingId, setReviewingId] = useState(null)
    const [message, setMessage] = useState('')

    const loadProofs = async () => {
        setLoading(true)
        setMessage('')

        const result = await supabase
            .from('task_assignments')
            .select(`
        id,
        status,
        proof_url,
        proof_note,
        submitted_at,
        points_awarded,
        ambassador_id,
        tasks (
          id,
          title,
          points,
          campaigns (
            id,
            title
          )
        ),
        ambassador:profiles!task_assignments_ambassador_id_fkey (
          id,
          full_name,
          email
        )
      `)
            .in('status', ['submitted', 'approved', 'rejected'])
            .order('submitted_at', { ascending: false })

        if (result.error) {
            setMessage(result.error.message)
            setLoading(false)
            return
        }

        setItems(result.data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadProofs()
    }, [])

    const summary = useMemo(() => {
        return {
            total: items.length,
            submitted: items.filter((item) => item.status === 'submitted').length,
            approved: items.filter((item) => item.status === 'approved').length,
            rejected: items.filter((item) => item.status === 'rejected').length,
        }
    }, [items])

    const openProof = async (path) => {
        if (!path) return

        const result = await supabase.storage
            .from('proof_uploads')
            .createSignedUrl(path, 60)

        if (result.error) {
            setMessage(result.error.message)
            return
        }

        window.open(result.data.signedUrl, '_blank', 'noreferrer')
    }

    const reviewProof = async (item, status) => {
        setReviewingId(item.id)
        setMessage('')

        const {
            data: { user },
        } = await supabase.auth.getUser()

        const points = status === 'approved' ? item.tasks?.points || 0 : 0

        const updateResult = await supabase
            .from('task_assignments')
            .update({
                status,
                reviewed_at: new Date().toISOString(),
                reviewed_by: user?.id || null,
                points_awarded: points,
            })
            .eq('id', item.id)

        if (updateResult.error) {
            setMessage(updateResult.error.message)
            setReviewingId(null)
            return
        }

        if (status === 'approved' && points > 0) {
            const pointsResult = await supabase
                .from('points_log')
                .insert({
                    ambassador_id: item.ambassador_id,
                    source_type: 'task',
                    source_id: item.id,
                    points,
                    note: `Task approved: ${item.tasks?.title || 'Task'}`,
                    awarded_by: user?.id || null,
                })

            if (pointsResult.error) {
                setMessage(pointsResult.error.message)
                setReviewingId(null)
                return
            }
        }

        await loadProofs()
        setReviewingId(null)
    }

    return (
        <DashboardLayout
            role="admin"
            title="Proofs"
            subtitle="Review ambassador proof uploads"
        >
            <section className="frint-card rounded-[24px] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                            Proof review
                        </h2>
                        <p className="mt-0.5 text-sm frint-muted">
                            Approve or reject submitted task proofs
                        </p>
                    </div>

                    <button
                        onClick={loadProofs}
                        className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                    >
                        <RefreshCw size={15} />
                        Refresh
                    </button>
                </div>

                {message && (
                    <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {message}
                    </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                        ['Total', summary.total],
                        ['Pending', summary.submitted],
                        ['Approved', summary.approved],
                        ['Rejected', summary.rejected],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-[var(--frint-soft-card)] px-3 py-2.5">
                            <p className="text-[11px] font-semibold frint-muted">{label}</p>
                            <p className="mt-0.5 text-xl font-semibold text-[var(--frint-text)]">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 space-y-3">
                    {loading ? (
                        <div className="rounded-[20px] border frint-border p-6 text-center text-sm font-medium frint-muted">
                            Loading proofs...
                        </div>
                    ) : items.length === 0 ? (
                        <EmptyState
                            title="No proofs found"
                            message="Submitted proofs will appear here."
                        />
                    ) : (
                        items.map((item) => {
                            const reviewing = reviewingId === item.id

                            return (
                                <article key={item.id} className="rounded-[20px] border frint-border p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="truncate text-base font-semibold text-[var(--frint-text)]">
                                                    {item.tasks?.title || 'Task'}
                                                </h3>
                                                <StatusBadge status={item.status} />
                                            </div>

                                            <p className="mt-1 text-sm frint-muted">
                                                {item.ambassador?.full_name || item.ambassador?.email || 'Ambassador'}
                                            </p>

                                            <p className="mt-0.5 text-xs frint-muted">
                                                {item.tasks?.campaigns?.title || 'No campaign'} • {item.tasks?.points || 0} points
                                            </p>
                                        </div>
                                    </div>

                                    {item.proof_note && (
                                        <p className="mt-3 rounded-2xl bg-[var(--frint-soft-card)] p-3 text-sm leading-6 frint-muted">
                                            {item.proof_note}
                                        </p>
                                    )}

                                    <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                                        <button
                                            onClick={() => openProof(item.proof_url)}
                                            className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                                        >
                                            <Download size={15} />
                                            View proof
                                        </button>

                                        {item.status === 'submitted' && (
                                            <>
                                                <button
                                                    onClick={() => reviewProof(item, 'approved')}
                                                    disabled={reviewing}
                                                    className="flex min-h-10 items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                                >
                                                    <CheckCircle2 size={15} />
                                                    Approve
                                                </button>

                                                <button
                                                    onClick={() => reviewProof(item, 'rejected')}
                                                    disabled={reviewing}
                                                    className="flex min-h-10 items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                                >
                                                    <XCircle size={15} />
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </article>
                            )
                        })
                    )}
                </div>
            </section>
        </DashboardLayout>
    )
}
