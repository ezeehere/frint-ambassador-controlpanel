import { useEffect, useMemo, useState } from 'react'
import { Building2, Plus, RefreshCw, Search, X } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'

const initialForm = {
    name: '',
    city: '',
    state: 'Assam',
    contact_person: '',
}

export default function Colleges() {
    const [colleges, setColleges] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [form, setForm] = useState(initialForm)
    const [message, setMessage] = useState('')
    const [showForm, setShowForm] = useState(false)

    const loadColleges = async () => {
        setLoading(true)
        setMessage('')

        const { data, error } = await supabase
            .from('colleges')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            setMessage(error.message)
        }

        setColleges(data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadColleges()
    }, [])

    const filteredColleges = useMemo(() => {
        const value = search.trim().toLowerCase()

        if (!value) return colleges

        return colleges.filter((college) => {
            return (
                college.name?.toLowerCase().includes(value) ||
                college.city?.toLowerCase().includes(value) ||
                college.state?.toLowerCase().includes(value)
            )
        })
    }, [colleges, search])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')

        const { error } = await supabase.from('colleges').insert({
            name: form.name.trim(),
            city: form.city.trim(),
            state: form.state.trim() || 'Assam',
            contact_person: form.contact_person.trim() || null,
            status: 'active',
        })

        if (error) {
            setMessage(error.message)
            setSaving(false)
            return
        }

        setForm(initialForm)
        setShowForm(false)
        await loadColleges()
        setSaving(false)
    }

    const updateStatus = async (collegeId, status) => {
        setMessage('')

        const { error } = await supabase
            .from('colleges')
            .update({ status })
            .eq('id', collegeId)

        if (error) {
            setMessage(error.message)
            return
        }

        await loadColleges()
    }

    return (
        <DashboardLayout
            role="admin"
            title="Colleges"
            subtitle="Manage campuses connected with Frint ambassadors"
        >
            <section className="frint-card rounded-[24px] p-4 sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="frint-icon-chip">
                            <Building2 size={19} />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                                College list
                            </h2>
                            <p className="text-sm frint-muted">
                                {filteredColleges.length} campuses
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-2 sm:flex sm:items-center">
                        <div className="flex min-w-0 items-center gap-2 rounded-full border frint-border bg-[var(--frint-card)] px-3 py-2">
                            <Search size={16} className="shrink-0 frint-muted" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search college"
                                className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 sm:w-56"
                            />
                        </div>

                        <button
                            onClick={() => setShowForm(true)}
                            className="frint-primary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                        >
                            <Plus size={15} />
                            Add college
                        </button>

                        <button
                            onClick={loadColleges}
                            className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                        >
                            <RefreshCw size={15} />
                            Refresh
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {message}
                    </div>
                )}

                {showForm && (
                    <form onSubmit={handleSubmit} className="mt-4 rounded-[20px] border frint-border bg-[var(--frint-soft-card)] p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-[var(--frint-text)]">
                                    Add college
                                </p>
                                <p className="text-xs frint-muted">
                                    Create a campus record for ambassador assignment.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="frint-secondary-btn flex h-9 w-9 items-center justify-center p-0"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="frint-input"
                                placeholder="College name"
                                required
                            />

                            <input
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                                className="frint-input"
                                placeholder="City"
                            />

                            <input
                                value={form.state}
                                onChange={(e) => setForm({ ...form, state: e.target.value })}
                                className="frint-input"
                                placeholder="State"
                            />

                            <input
                                value={form.contact_person}
                                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                                className="frint-input"
                                placeholder="Contact person optional"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="frint-primary-btn mt-3 flex w-full items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60 sm:w-fit"
                        >
                            <Plus size={16} />
                            {saving ? 'Adding...' : 'Add college'}
                        </button>
                    </form>
                )}

                <div className="mt-4">
                    {loading ? (
                        <div className="rounded-[20px] border frint-border p-6 text-center text-sm font-medium frint-muted">
                            Loading colleges...
                        </div>
                    ) : filteredColleges.length === 0 ? (
                        <EmptyState
                            title="No colleges found"
                            message="Add the first college to start assigning ambassadors."
                        />
                    ) : (
                        <>
                            <div className="grid gap-3 md:hidden">
                                {filteredColleges.map((college) => (
                                    <article key={college.id} className="rounded-[20px] border frint-border p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-[var(--frint-text)]">
                                                    {college.name}
                                                </p>
                                                <p className="mt-1 text-sm frint-muted">
                                                    {[college.city, college.state].filter(Boolean).join(', ') || 'Location not added'}
                                                </p>
                                                {college.contact_person && (
                                                    <p className="mt-1 text-xs frint-muted">
                                                        Contact: {college.contact_person}
                                                    </p>
                                                )}
                                            </div>

                                            <StatusBadge status={college.status} />
                                        </div>

                                        <select
                                            value={college.status}
                                            onChange={(e) => updateStatus(college.id, e.target.value)}
                                            className="frint-input mt-3"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </article>
                                ))}
                            </div>

                            <div className="hidden overflow-hidden rounded-[20px] border frint-border md:block">
                                <table className="w-full text-left">
                                    <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">
                                                College
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">
                                                Location
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">
                                                Update
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredColleges.map((college) => (
                                            <tr key={college.id} className="border-b frint-border last:border-b-0">
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-[var(--frint-text)]">
                                                        {college.name}
                                                    </p>
                                                    {college.contact_person && (
                                                        <p className="mt-0.5 text-sm frint-muted">
                                                            {college.contact_person}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-sm frint-muted">
                                                    {[college.city, college.state].filter(Boolean).join(', ') || 'Not added'}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <StatusBadge status={college.status} />
                                                </td>

                                                <td className="px-4 py-3">
                                                    <select
                                                        value={college.status}
                                                        onChange={(e) => updateStatus(college.id, e.target.value)}
                                                        className="rounded-full border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-medium outline-none"
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </DashboardLayout>
    )
}
