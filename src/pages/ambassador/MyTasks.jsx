import { useEffect, useState } from 'react'
import { Clock, FileUp, RefreshCw, UploadCloud } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

function formatDate(value) {
    if (!value) return 'No deadline'

    return new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export default function MyTasks() {
    const [assignments, setAssignments] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploadingId, setUploadingId] = useState(null)
    const [proofNotes, setProofNotes] = useState({})
    const [message, setMessage] = useState('')

    const loadTasks = async () => {
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
            .from('task_assignments')
            .select(`
        id,
        task_id,
        status,
        proof_url,
        proof_note,
        submitted_at,
        points_awarded,
        created_at,
        tasks (
          id,
          title,
          description,
          points,
          due_date,
          status,
          campaigns (
            id,
            title
          )
        )
      `)
            .eq('ambassador_id', user.id)
            .order('created_at', { ascending: false })

        if (result.error) {
            setMessage(result.error.message)
            setLoading(false)
            return
        }

        setAssignments(result.data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadTasks()
    }, [])

    const uploadProof = async (assignment) => {
        const fileInput = document.getElementById(`proof-${assignment.id}`)
        const file = fileInput?.files?.[0]

        if (!file) {
            setMessage('Please choose a proof file first.')
            return
        }

        setUploadingId(assignment.id)
        setMessage('')

        const {
            data: { user },
        } = await supabase.auth.getUser()

        const fileExt = file.name.split('.').pop()
        const filePath = `${user.id}/${assignment.id}-${Date.now()}.${fileExt}`

        const uploadResult = await supabase.storage
            .from('proof_uploads')
            .upload(filePath, file, {
                upsert: true,
            })

        if (uploadResult.error) {
            setMessage(uploadResult.error.message)
            setUploadingId(null)
            return
        }

        const updateResult = await supabase
            .from('task_assignments')
            .update({
                status: 'submitted',
                proof_url: filePath,
                proof_note: proofNotes[assignment.id] || null,
                submitted_at: new Date().toISOString(),
            })
            .eq('id', assignment.id)

        if (updateResult.error) {
            setMessage(updateResult.error.message)
            setUploadingId(null)
            return
        }

        await loadTasks()
        setUploadingId(null)
    }

    const taskStats = {
        total: assignments.length,
        pending: assignments.filter((item) => item.status === 'pending').length,
        submitted: assignments.filter((item) => item.status === 'submitted').length,
        approved: assignments.filter((item) => item.status === 'approved').length,
    }

    return (
        <DashboardLayout
            role="ambassador"
            title="My Tasks"
            subtitle="Submit proof for assigned work"
        >
            {message && (
                <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {message}
                </div>
            )}

            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[var(--frint-text)]">
                        Task proof centre
                    </p>
                    <p className="text-xs frint-muted">
                        Upload screenshots, PDFs, or notes for assigned tasks.
                    </p>
                </div>

                <button
                    onClick={loadTasks}
                    className="frint-secondary-btn flex items-center gap-2 px-3 py-2 text-sm"
                >
                    <RefreshCw size={15} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>

            <div className="mb-4 grid grid-cols-4 gap-2">
                {[
                    ['Total', taskStats.total],
                    ['Pending', taskStats.pending],
                    ['Submitted', taskStats.submitted],
                    ['Approved', taskStats.approved],
                ].map(([label, value]) => (
                    <div
                        key={label}
                        className="rounded-[18px] border frint-border bg-[var(--frint-card)] px-3 py-2"
                    >
                        <p className="truncate text-[11px] font-medium frint-muted">
                            {label}
                        </p>
                        <p className="mt-0.5 text-lg font-semibold text-[var(--frint-text)]">
                            {loading ? '...' : value}
                        </p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="frint-card rounded-[24px] p-6 text-center text-sm font-medium frint-muted">
                    Loading tasks...
                </div>
            ) : assignments.length === 0 ? (
                <EmptyState
                    title="No tasks assigned"
                    message="Assigned tasks will appear here."
                />
            ) : (
                <div className="grid gap-3">
                    {assignments.map((assignment) => {
                        const task = assignment.tasks
                        const uploading = uploadingId === assignment.id
                        const isApproved = assignment.status === 'approved'
                        const isSubmitted = assignment.status === 'submitted'

                        return (
                            <section
                                key={assignment.id}
                                className="frint-card rounded-[24px] p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="truncate text-lg font-semibold text-[var(--frint-text)]">
                                                {task?.title || 'Task'}
                                            </h2>
                                            <StatusBadge status={assignment.status} />
                                        </div>

                                        <p className="mt-1 text-sm frint-muted">
                                            {task?.campaigns?.title || 'No campaign'} • {task?.points || 0} points
                                        </p>
                                    </div>

                                    <div className="hidden rounded-2xl bg-[var(--frint-soft-card)] p-2 text-[var(--frint-accent)] sm:block">
                                        <FileUp size={18} />
                                    </div>
                                </div>

                                {task?.description && (
                                    <p className="mt-3 rounded-[18px] bg-[var(--frint-soft-card)] px-3 py-2 text-sm frint-muted">
                                        {task.description}
                                    </p>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--frint-soft-card)] px-3 py-1 text-xs font-medium frint-muted">
                                        <Clock size={13} />
                                        {formatDate(task?.due_date)}
                                    </span>

                                    {isSubmitted && (
                                        <span className="rounded-full bg-[var(--frint-soft-card)] px-3 py-1 text-xs font-medium frint-muted">
                                            Waiting for review
                                        </span>
                                    )}

                                    {isApproved && (
                                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                            {assignment.points_awarded || task?.points || 0} points awarded
                                        </span>
                                    )}
                                </div>

                                {!isApproved && (
                                    <div className="mt-4 rounded-[20px] border frint-border bg-[var(--frint-soft-card)] p-3">
                                        <div className="mb-3">
                                            <p className="text-sm font-semibold text-[var(--frint-text)]">
                                                {isSubmitted ? 'Update proof' : 'Submit proof'}
                                            </p>
                                            <p className="text-xs frint-muted">
                                                Upload a screenshot, poster, PDF, or short proof note.
                                            </p>
                                        </div>

                                        <input
                                            id={`proof-${assignment.id}`}
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="frint-input"
                                        />

                                        <textarea
                                            value={proofNotes[assignment.id] || ''}
                                            onChange={(e) =>
                                                setProofNotes({
                                                    ...proofNotes,
                                                    [assignment.id]: e.target.value,
                                                })
                                            }
                                            className="frint-input mt-2 min-h-20 resize-y"
                                            placeholder="Add a short note, optional"
                                        />

                                        <button
                                            onClick={() => uploadProof(assignment)}
                                            disabled={uploading}
                                            className="frint-primary-btn mt-3 flex w-full items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
                                        >
                                            <UploadCloud size={16} />
                                            {uploading ? 'Uploading...' : isSubmitted ? 'Update proof' : 'Submit proof'}
                                        </button>
                                    </div>
                                )}
                            </section>
                        )
                    })}
                </div>
            )}
        </DashboardLayout>
    )
}
