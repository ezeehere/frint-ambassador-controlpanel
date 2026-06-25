import { useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
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
            <section className="frint-card rounded-[30px] p-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-[var(--frint-text)]">
                            Proof review
                        </h2>
                        <p className="mt-1 text-sm frint-muted">
                            Submitted task proofs
                        </p>
                    </div>

                    <button
                        onClick={loadProofs}
                        className="frint-secondary-btn flex items-center gap-2 px-4 py-2 text-sm"
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

                <div className="mt-5 space-y-4">
                    {loading ? (
                        <div className="rounded-[24px] border frint-border p-8 text-center text-sm font-bold frint-muted">
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
                                <div key={item.id} className="rounded-[26px] border frint-border p-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <h3 className="text-lg font-black text-[var(--frint-text)]">
                                                {item.tasks?.title || 'Task'}
                                            </h3>

                                            <p className="mt-1 text-sm font-bold frint-muted">
                                                {item.profiles?.full_name || item.profiles?.email || 'Ambassador'}
                                                {' '}• {item.tasks?.campaigns?.title || 'No campaign'}
                                            </p>

                                            {item.proof_note && (
                                                <p className="mt-3 rounded-[20px] bg-[var(--frint-soft-card)] p-3 text-sm font-bold frint-muted">
                                                    {item.proof_note}
                                                </p>
                                            )}
                                        </div>

                                        <StatusBadge status={item.status} />
                                    </div>

                                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            onClick={() => openProof(item.proof_url)}
                                            className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2.5 text-sm"
                                        >
                                            <Download size={16} />
                                            View proof
                                        </button>

                                        {item.status === 'submitted' && (
                                            <>
                                                <button
                                                    onClick={() => reviewProof(item, 'approved')}
                                                    disabled={reviewing}
                                                    className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
                                                >
                                                    Approve
                                                </button>

                                                <button
                                                    onClick={() => reviewProof(item, 'rejected')}
                                                    disabled={reviewing}
                                                    className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </section>
        </DashboardLayout>
    )
}