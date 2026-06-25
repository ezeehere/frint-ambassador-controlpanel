import { useEffect, useState } from 'react'
import { ClipboardCheck, Plus, RefreshCw } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

const initialForm = {
    title: '',
    description: '',
    campaign_id: '',
    points: 10,
    due_date: '',
    status: 'active',
}

export default function Tasks() {
    const [tasks, setTasks] = useState([])
    const [campaigns, setCampaigns] = useState([])
    const [ambassadors, setAmbassadors] = useState([])
    const [selectedAmbassadors, setSelectedAmbassadors] = useState([])
    const [form, setForm] = useState(initialForm)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    const loadData = async () => {
        setLoading(true)
        setMessage('')

        const tasksResult = await supabase
            .from('tasks')
            .select(`
        id,
        title,
        description,
        points,
        due_date,
        status,
        created_at,
        campaigns (
          id,
          title
        ),
        task_assignments (
            id,
            status,
            ambassador_id,
            ambassador:profiles!task_assignments_ambassador_id_fkey (
                id,
                full_name,
                email
                )
            )
      `)
            .order('created_at', { ascending: false })

        const campaignsResult = await supabase
            .from('campaigns')
            .select('id, title, status')
            .order('created_at', { ascending: false })

        const ambassadorsResult = await supabase
            .from('profiles')
            .select(`
        id,
        full_name,
        email,
        college_id,
        colleges (
          id,
          name
        )
      `)
            .eq('role', 'ambassador')
            .eq('status', 'active')
            .order('full_name', { ascending: true })

        if (tasksResult.error) setMessage(tasksResult.error.message)
        if (campaignsResult.error) setMessage(campaignsResult.error.message)
        if (ambassadorsResult.error) setMessage(ambassadorsResult.error.message)

        setTasks(tasksResult.data || [])
        setCampaigns(campaignsResult.data || [])
        setAmbassadors(ambassadorsResult.data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    const toggleAmbassador = (id) => {
        setSelectedAmbassadors((current) => {
            if (current.includes(id)) {
                return current.filter((item) => item !== id)
            }

            return [...current, id]
        })
    }

    const handleCreateTask = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')

        const {
            data: { user },
        } = await supabase.auth.getUser()

        const taskResult = await supabase
            .from('tasks')
            .insert({
                title: form.title.trim(),
                description: form.description.trim() || null,
                campaign_id: form.campaign_id || null,
                points: Number(form.points) || 0,
                due_date: form.due_date || null,
                status: form.status,
                created_by: user?.id || null,
            })
            .select()
            .single()

        if (taskResult.error) {
            setMessage(taskResult.error.message)
            setSaving(false)
            return
        }

        if (selectedAmbassadors.length > 0) {
            const rows = selectedAmbassadors.map((ambassadorId) => ({
                task_id: taskResult.data.id,
                ambassador_id: ambassadorId,
                status: 'pending',
                points_awarded: 0,
            }))

            const assignmentResult = await supabase
                .from('task_assignments')
                .insert(rows)

            if (assignmentResult.error) {
                setMessage(assignmentResult.error.message)
                setSaving(false)
                return
            }
        }

        setForm(initialForm)
        setSelectedAmbassadors([])
        await loadData()
        setSaving(false)
    }

    return (
        <DashboardLayout
            role="admin"
            title="Tasks"
            subtitle="Assign work to ambassadors"
        >
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
                <section className="frint-card rounded-[30px] p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
                            <ClipboardCheck size={21} />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                New task
                            </h2>
                            <p className="text-sm frint-muted">
                                Assign task and points
                            </p>
                        </div>
                    </div>

                    {message && (
                        <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleCreateTask} className="mt-6 space-y-4">
                        <input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                            placeholder="Task title"
                            required
                        />

                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="min-h-24 w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                            placeholder="Task details"
                        />

                        <select
                            value={form.campaign_id}
                            onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
                            className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                        >
                            <option value="">No campaign</option>
                            {campaigns.map((campaign) => (
                                <option key={campaign.id} value={campaign.id}>
                                    {campaign.title}
                                </option>
                            ))}
                        </select>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <input
                                type="number"
                                min="0"
                                value={form.points}
                                onChange={(e) => setForm({ ...form, points: e.target.value })}
                                className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="Points"
                            />

                            <input
                                type="date"
                                value={form.due_date}
                                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                            />
                        </div>

                        <div className="rounded-[22px] border frint-border bg-[var(--frint-soft-card)] p-3">
                            <p className="mb-3 text-sm font-black text-[var(--frint-text)]">
                                Assign ambassadors
                            </p>

                            <div className="max-h-56 space-y-2 overflow-y-auto">
                                {ambassadors.length === 0 ? (
                                    <p className="text-sm font-bold frint-muted">
                                        No active ambassadors found.
                                    </p>
                                ) : (
                                    ambassadors.map((ambassador) => (
                                        <label
                                            key={ambassador.id}
                                            className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[var(--frint-card)] px-3 py-3"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedAmbassadors.includes(ambassador.id)}
                                                onChange={() => toggleAmbassador(ambassador.id)}
                                            />

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-black text-[var(--frint-text)]">
                                                    {ambassador.full_name || ambassador.email}
                                                </p>
                                                <p className="truncate text-xs frint-muted">
                                                    {ambassador.colleges?.name || 'No college'}
                                                </p>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="frint-primary-btn flex w-full items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60"
                        >
                            <Plus size={17} />
                            {saving ? 'Creating...' : 'Create task'}
                        </button>
                    </form>
                </section>

                <section className="frint-card rounded-[30px] p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                Task list
                            </h2>
                            <p className="mt-1 text-sm frint-muted">
                                Assigned work and status
                            </p>
                        </div>

                        <button
                            onClick={loadData}
                            className="frint-secondary-btn flex items-center gap-2 px-4 py-2 text-sm"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>

                    <div className="mt-5 space-y-4">
                        {loading ? (
                            <div className="rounded-[24px] border frint-border p-8 text-center text-sm font-bold frint-muted">
                                Loading tasks...
                            </div>
                        ) : tasks.length === 0 ? (
                            <EmptyState
                                title="No tasks found"
                                message="Create a task and assign it to ambassadors."
                            />
                        ) : (
                            tasks.map((task) => (
                                <div key={task.id} className="rounded-[26px] border frint-border p-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <h3 className="text-lg font-black text-[var(--frint-text)]">
                                                {task.title}
                                            </h3>
                                            <p className="mt-1 text-sm font-bold frint-muted">
                                                {task.campaigns?.title || 'No campaign'} • {task.points} points
                                            </p>
                                        </div>

                                        <StatusBadge status={task.status} />
                                    </div>

                                    {task.description && (
                                        <p className="mt-3 text-sm font-bold frint-muted">
                                            {task.description}
                                        </p>
                                    )}

                                    <div className="mt-4 rounded-[22px] bg-[var(--frint-soft-card)] p-4">
                                        <p className="mb-3 text-sm font-black text-[var(--frint-text)]">
                                            Assignments
                                        </p>

                                        {task.task_assignments?.length === 0 ? (
                                            <p className="text-sm font-bold frint-muted">
                                                No ambassadors assigned.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {task.task_assignments?.map((assignment) => (
                                                    <div
                                                        key={assignment.id}
                                                        className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--frint-card)] px-4 py-3"
                                                    >
                                                        <div>
                                                            <p className="font-black text-[var(--frint-text)]">
                                                                {assignment.ambassador?.full_name || assignment.ambassador?.email || 'Ambassador'}
                                                            </p>
                                                        </div>

                                                        <StatusBadge status={assignment.status} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    )
}