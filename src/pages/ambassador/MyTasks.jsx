import { useEffect, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

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

    return (
        <DashboardLayout
            role="ambassador"
            title="My Tasks"
            subtitle="Submit proof for assigned work"
        >
            {message && (
                <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {message}
                </div>
            )}

            {loading ? (
                <div className="frint-card rounded-[30px] p-8 text-center text-sm font-bold frint-muted">
                    Loading tasks...
                </div>
            ) : assignments.length === 0 ? (
                <EmptyState
                    title="No tasks assigned"
                    message="Assigned tasks will appear here."
                />
            ) : (
                <div className="grid gap-5">
                    {assignments.map((assignment) => {
                        const task = assignment.tasks
                        const uploading = uploadingId === assignment.id

                        return (
                            <section key={assignment.id} className="frint-card rounded-[30px] p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-[var(--frint-text)]">
                                            {task?.title || 'Task'}
                                        </h2>
                                        <p className="mt-1 text-sm font-bold frint-muted">
                                            {task?.campaigns?.title || 'No campaign'} • {task?.points || 0} points
                                        </p>
                                    </div>

                                    <StatusBadge status={assignment.status} />
                                </div>

                                {task?.description && (
                                    <p className="mt-4 rounded-[22px] bg-[var(--frint-soft-card)] p-4 text-sm font-bold frint-muted">
                                        {task.description}
                                    </p>
                                )}

                                {task?.due_date && (
                                    <p className="mt-4 text-sm font-black frint-muted">
                                        Due: {task.due_date}
                                    </p>
                                )}

                                {assignment.status === 'approved' ? (
                                    <div className="mt-5 rounded-[22px] bg-green-50 p-4 text-sm font-black text-green-700">
                                        Approved. Points awarded: {assignment.points_awarded}
                                    </div>
                                ) : (
                                    <div className="mt-5 rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
                                        <p className="mb-3 text-sm font-black text-[var(--frint-text)]">
                                            Upload proof
                                        </p>

                                        <input
                                            id={`proof-${assignment.id}`}
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                        />

                                        <textarea
                                            value={proofNotes[assignment.id] || ''}
                                            onChange={(e) =>
                                                setProofNotes({
                                                    ...proofNotes,
                                                    [assignment.id]: e.target.value,
                                                })
                                            }
                                            className="mt-3 min-h-20 w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                            placeholder="Proof note optional"
                                        />

                                        <button
                                            onClick={() => uploadProof(assignment)}
                                            disabled={uploading}
                                            className="frint-primary-btn mt-3 flex items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60"
                                        >
                                            <UploadCloud size={17} />
                                            {uploading ? 'Uploading...' : 'Submit proof'}
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