import { useEffect, useMemo, useState } from 'react'
import {
    Award,
    CalendarClock,
    CheckCircle2,
    ClipboardCheck,
    Plus,
    RefreshCw,
    Users,
    X,
} from 'lucide-react'
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

const steps = [
    {
        id: 1,
        title: 'Task',
        helper: 'What should ambassadors do?',
    },
    {
        id: 2,
        title: 'Reward',
        helper: 'Points and deadline',
    },
    {
        id: 3,
        title: 'People',
        helper: 'Assign ambassadors',
    },
    {
        id: 4,
        title: 'Review',
        helper: 'Confirm and publish',
    },
]

function formatDate(date) {
    if (!date) return 'No deadline'

    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function getCampaignName(campaigns, campaignId) {
    if (!campaignId) return 'No campaign linked'

    return campaigns.find((campaign) => campaign.id === campaignId)?.title || 'Selected campaign'
}

function getAmbassadorName(ambassador) {
    return ambassador.full_name || ambassador.email || 'Ambassador'
}

export default function Tasks() {
    const [tasks, setTasks] = useState([])
    const [campaigns, setCampaigns] = useState([])
    const [ambassadors, setAmbassadors] = useState([])
    const [selectedAmbassadors, setSelectedAmbassadors] = useState([])
    const [form, setForm] = useState(initialForm)
    const [showCreator, setShowCreator] = useState(false)
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    const selectedAmbassadorRecords = useMemo(() => {
        return ambassadors.filter((ambassador) =>
            selectedAmbassadors.includes(ambassador.id)
        )
    }, [ambassadors, selectedAmbassadors])

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

    const resetCreator = () => {
        setForm(initialForm)
        setSelectedAmbassadors([])
        setStep(1)
        setMessage('')
        setShowCreator(false)
    }

    const goNext = () => {
        setMessage('')

        if (step === 1 && !form.title.trim()) {
            setMessage('Task title is required.')
            return
        }

        setStep((current) => Math.min(current + 1, steps.length))
    }

    const goBack = () => {
        setMessage('')
        setStep((current) => Math.max(current - 1, 1))
    }

    const handleCreateTask = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')

        if (!form.title.trim()) {
            setMessage('Task title is required.')
            setSaving(false)
            return
        }

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
        setStep(1)
        setShowCreator(false)
        await loadData()
        setSaving(false)
    }

    const taskStats = useMemo(() => {
        const total = tasks.length
        const active = tasks.filter((task) => task.status === 'active').length
        const assigned = tasks.reduce(
            (count, task) => count + (task.task_assignments?.length || 0),
            0
        )

        return { total, active, assigned }
    }, [tasks])

    return (
        <DashboardLayout
            role="admin"
            title="Tasks"
            subtitle="Assign focused work to ambassadors"
        >
            <div className="space-y-4">
                <section className="frint-card rounded-[24px] p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="frint-icon-chip">
                                <ClipboardCheck size={19} />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                                    Task board
                                </h2>
                                <p className="text-sm frint-muted">
                                    Create, assign, and track ambassador work
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex">
                            <button
                                onClick={loadData}
                                className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                            >
                                <RefreshCw size={15} />
                                Refresh
                            </button>

                            <button
                                onClick={() => {
                                    setShowCreator(true)
                                    setMessage('')
                                }}
                                className="frint-primary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                            >
                                <Plus size={15} />
                                New task
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl bg-[var(--frint-soft-card)] px-3 py-3">
                            <p className="text-[11px] font-semibold frint-muted">Tasks</p>
                            <p className="mt-1 text-xl font-semibold text-[var(--frint-text)]">
                                {taskStats.total}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-[var(--frint-soft-card)] px-3 py-3">
                            <p className="text-[11px] font-semibold frint-muted">Active</p>
                            <p className="mt-1 text-xl font-semibold text-[var(--frint-text)]">
                                {taskStats.active}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-[var(--frint-soft-card)] px-3 py-3">
                            <p className="text-[11px] font-semibold frint-muted">Assigned</p>
                            <p className="mt-1 text-xl font-semibold text-[var(--frint-text)]">
                                {taskStats.assigned}
                            </p>
                        </div>
                    </div>
                </section>

                {message && (
                    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {message}
                    </div>
                )}

                {showCreator && (
                    <section className="frint-card rounded-[24px] p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                                    New task
                                </h2>
                                <p className="text-sm frint-muted">
                                    Step {step} of {steps.length}: {steps[step - 1].helper}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={resetCreator}
                                className="frint-secondary-btn flex h-9 w-9 shrink-0 items-center justify-center p-0"
                                aria-label="Close task creator"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-1.5">
                            {steps.map((item) => {
                                const active = step === item.id
                                const done = step > item.id

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            if (item.id === 1 || form.title.trim()) {
                                                setStep(item.id)
                                                setMessage('')
                                            }
                                        }}
                                        className={[
                                            'rounded-2xl px-2 py-2 text-center transition',
                                            active || done
                                                ? 'bg-[var(--frint-accent-soft)] text-[var(--frint-text)]'
                                                : 'bg-[var(--frint-soft-card)] frint-muted',
                                        ].join(' ')}
                                    >
                                        <p className="text-[11px] font-semibold">{item.id}</p>
                                        <p className="truncate text-[10px] font-semibold">{item.title}</p>
                                    </button>
                                )
                            })}
                        </div>

                        <form onSubmit={handleCreateTask} className="mt-4">
                            {step === 1 && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-semibold text-[var(--frint-text)]">
                                            Task title
                                        </label>
                                        <p className="mb-2 text-xs frint-muted">
                                            Keep it action-based. Example: Share the workshop poster in 5 student groups.
                                        </p>
                                        <input
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            className="frint-input"
                                            placeholder="Share Frint internship drive poster"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-[var(--frint-text)]">
                                            Task details
                                        </label>
                                        <p className="mb-2 text-xs frint-muted">
                                            Explain what proof you expect and any rules they should follow.
                                        </p>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            className="frint-input min-h-24 resize-y"
                                            placeholder="Ask ambassadors to share the link and upload a screenshot as proof."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-[var(--frint-text)]">
                                            Related campaign
                                        </label>
                                        <p className="mb-2 text-xs frint-muted">
                                            Optional. Link this task to a campaign if it supports one.
                                        </p>
                                        <select
                                            value={form.campaign_id}
                                            onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
                                            className="frint-input"
                                        >
                                            <option value="">No campaign</option>
                                            {campaigns.map((campaign) => (
                                                <option key={campaign.id} value={campaign.id}>
                                                    {campaign.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-semibold text-[var(--frint-text)]">
                                            Points
                                        </label>
                                        <p className="mb-2 text-xs frint-muted">
                                            Points awarded after admin approves the submitted proof.
                                        </p>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.points}
                                            onChange={(e) => setForm({ ...form, points: e.target.value })}
                                            className="frint-input"
                                            placeholder="10"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-[var(--frint-text)]">
                                            Deadline
                                        </label>
                                        <p className="mb-2 text-xs frint-muted">
                                            Optional. Leave empty if this task has no strict deadline.
                                        </p>
                                        <input
                                            type="date"
                                            value={form.due_date}
                                            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                            className="frint-input"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-[var(--frint-text)]">
                                            Task status
                                        </label>
                                        <p className="mb-2 text-xs frint-muted">
                                            Keep it active if ambassadors should see it immediately.
                                        </p>
                                        <select
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                                            className="frint-input"
                                        >
                                            <option value="active">Active</option>
                                            <option value="draft">Draft</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <label className="text-sm font-semibold text-[var(--frint-text)]">
                                                Assign ambassadors
                                            </label>
                                            <p className="mt-1 text-xs frint-muted">
                                                Select the ambassadors who should complete this task.
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-[var(--frint-soft-card)] px-3 py-1 text-xs font-semibold frint-muted">
                                            {selectedAmbassadors.length} selected
                                        </span>
                                    </div>

                                    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto frint-scrollbar">
                                        {ambassadors.length === 0 ? (
                                            <p className="rounded-2xl bg-[var(--frint-soft-card)] p-4 text-sm font-medium frint-muted">
                                                No active ambassadors found.
                                            </p>
                                        ) : (
                                            ambassadors.map((ambassador) => (
                                                <label
                                                    key={ambassador.id}
                                                    className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[var(--frint-soft-card)] px-3 py-3"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAmbassadors.includes(ambassador.id)}
                                                        onChange={() => toggleAmbassador(ambassador.id)}
                                                    />

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-[var(--frint-text)]">
                                                            {getAmbassadorName(ambassador)}
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
                            )}

                            {step === 4 && (
                                <div className="space-y-3">
                                    <div className="rounded-[20px] bg-[var(--frint-soft-card)] p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide frint-muted">
                                            Task
                                        </p>
                                        <h3 className="mt-1 text-lg font-semibold text-[var(--frint-text)]">
                                            {form.title || 'Untitled task'}
                                        </h3>
                                        <p className="mt-1 text-sm frint-muted">
                                            {form.description || 'No details added'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-2xl bg-[var(--frint-soft-card)] p-3">
                                            <div className="flex items-center gap-2 frint-muted">
                                                <Award size={15} />
                                                <p className="text-xs font-semibold">Points</p>
                                            </div>
                                            <p className="mt-1 text-xl font-semibold text-[var(--frint-text)]">
                                                {Number(form.points) || 0}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-[var(--frint-soft-card)] p-3">
                                            <div className="flex items-center gap-2 frint-muted">
                                                <CalendarClock size={15} />
                                                <p className="text-xs font-semibold">Deadline</p>
                                            </div>
                                            <p className="mt-1 text-sm font-semibold text-[var(--frint-text)]">
                                                {formatDate(form.due_date)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-[20px] bg-[var(--frint-soft-card)] p-4">
                                        <div className="flex items-center gap-2 frint-muted">
                                            <Users size={15} />
                                            <p className="text-xs font-semibold uppercase tracking-wide">
                                                Assigned ambassadors
                                            </p>
                                        </div>

                                        {selectedAmbassadorRecords.length === 0 ? (
                                            <p className="mt-2 text-sm frint-muted">
                                                No ambassadors selected. You can still create this task and assign later manually.
                                            </p>
                                        ) : (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {selectedAmbassadorRecords.map((ambassador) => (
                                                    <span
                                                        key={ambassador.id}
                                                        className="rounded-full bg-[var(--frint-card)] px-3 py-1 text-xs font-semibold frint-muted"
                                                    >
                                                        {getAmbassadorName(ambassador)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="frint-primary-btn flex w-full items-center justify-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60"
                                    >
                                        <CheckCircle2 size={16} />
                                        {saving ? 'Creating...' : 'Create task'}
                                    </button>
                                </div>
                            )}

                            <div className="mt-5 flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    disabled={step === 1}
                                    className="frint-secondary-btn px-4 py-2 text-sm disabled:opacity-40"
                                >
                                    Back
                                </button>

                                {step < steps.length && (
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        className="frint-primary-btn px-5 py-2 text-sm"
                                    >
                                        Continue
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>
                )}

                <section className="frint-card rounded-[24px] p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                                Task list
                            </h2>
                            <p className="text-sm frint-muted">
                                {tasks.length} tasks created
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {loading ? (
                            <div className="rounded-[20px] border frint-border p-6 text-center text-sm font-medium frint-muted">
                                Loading tasks...
                            </div>
                        ) : tasks.length === 0 ? (
                            <EmptyState
                                title="No tasks found"
                                message="Create a task and assign it to ambassadors."
                            />
                        ) : (
                            tasks.map((task) => (
                                <article
                                    key={task.id}
                                    className="rounded-[20px] border frint-border bg-[var(--frint-card)] p-4"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="truncate text-[16px] font-semibold text-[var(--frint-text)]">
                                                    {task.title}
                                                </h3>
                                                <StatusBadge status={task.status} />
                                            </div>

                                            <p className="mt-1 text-sm font-medium frint-muted">
                                                {task.campaigns?.title || 'No campaign'} • {task.points} points
                                            </p>

                                            {task.due_date && (
                                                <p className="mt-1 text-xs frint-muted">
                                                    Due {formatDate(task.due_date)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-full bg-[var(--frint-soft-card)] px-3 py-1 text-xs font-semibold frint-muted">
                                            {task.task_assignments?.length || 0} assigned
                                        </div>
                                    </div>

                                    {task.description && (
                                        <p className="mt-3 text-sm frint-muted">
                                            {task.description}
                                        </p>
                                    )}

                                    <div className="mt-3 rounded-[18px] bg-[var(--frint-soft-card)] p-3">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide frint-muted">
                                            Assignments
                                        </p>

                                        {task.task_assignments?.length === 0 ? (
                                            <p className="text-sm frint-muted">
                                                No ambassadors assigned.
                                            </p>
                                        ) : (
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {task.task_assignments?.map((assignment) => (
                                                    <div
                                                        key={assignment.id}
                                                        className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--frint-card)] px-3 py-2"
                                                    >
                                                        <p className="min-w-0 truncate text-sm font-semibold text-[var(--frint-text)]">
                                                            {assignment.ambassador?.full_name ||
                                                                assignment.ambassador?.email ||
                                                                'Ambassador'}
                                                        </p>

                                                        <StatusBadge status={assignment.status} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    )
}
