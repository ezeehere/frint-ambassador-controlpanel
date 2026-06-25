import { useEffect, useMemo, useState } from 'react'
import { Building2, Plus, RefreshCw, Search } from 'lucide-react'
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
            subtitle="Manage colleges connected with Frint ambassadors"
        >
            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.25fr]">
                <section className="frint-card rounded-[30px] p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
                            <Building2 size={21} />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                Add college
                            </h2>
                            <p className="text-sm frint-muted">
                                Create a campus record
                            </p>
                        </div>
                    </div>

                    {message && (
                        <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <label className="block">
                            <span className="mb-2 block text-sm font-black text-[var(--frint-text)]">
                                College name
                            </span>
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="Jorhat Institute of Science and Technology"
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-black text-[var(--frint-text)]">
                                City
                            </span>
                            <input
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                                className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="Jorhat"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-black text-[var(--frint-text)]">
                                State
                            </span>
                            <input
                                value={form.state}
                                onChange={(e) => setForm({ ...form, state: e.target.value })}
                                className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="Assam"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-black text-[var(--frint-text)]">
                                Contact person
                            </span>
                            <input
                                value={form.contact_person}
                                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                                className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="Optional"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={saving}
                            className="frint-primary-btn flex w-full items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60"
                        >
                            <Plus size={17} />
                            {saving ? 'Adding...' : 'Add college'}
                        </button>
                    </form>
                </section>

                <section className="frint-card rounded-[30px] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-black text-[var(--frint-text)]">
                                College list
                            </h2>
                            <p className="mt-1 text-sm frint-muted">
                                Active and inactive campuses
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="flex items-center gap-2 rounded-full border frint-border bg-[var(--frint-card)] px-4 py-2.5">
                                <Search size={17} className="frint-muted" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search college"
                                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 sm:w-56"
                                />
                            </div>

                            <button
                                onClick={loadColleges}
                                className="frint-secondary-btn flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border frint-border">
                        {loading ? (
                            <div className="p-8 text-center text-sm font-bold frint-muted">
                                Loading colleges...
                            </div>
                        ) : filteredColleges.length === 0 ? (
                            <div className="p-5">
                                <EmptyState
                                    title="No colleges found"
                                    message="Add your first college from the form."
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-[760px] w-full text-left">
                                    <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                        <tr>
                                            <th className="px-4 py-4 text-xs font-black uppercase tracking-wide frint-muted">
                                                College
                                            </th>
                                            <th className="px-4 py-4 text-xs font-black uppercase tracking-wide frint-muted">
                                                Location
                                            </th>
                                            <th className="px-4 py-4 text-xs font-black uppercase tracking-wide frint-muted">
                                                Status
                                            </th>
                                            <th className="px-4 py-4 text-xs font-black uppercase tracking-wide frint-muted">
                                                Update
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredColleges.map((college) => (
                                            <tr key={college.id} className="border-b frint-border last:border-b-0">
                                                <td className="px-4 py-4">
                                                    <p className="font-black text-[var(--frint-text)]">
                                                        {college.name}
                                                    </p>
                                                    {college.contact_person && (
                                                        <p className="mt-1 text-sm frint-muted">
                                                            {college.contact_person}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 text-sm font-bold frint-muted">
                                                    {[college.city, college.state].filter(Boolean).join(', ') || 'Not added'}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <StatusBadge status={college.status} />
                                                </td>

                                                <td className="px-4 py-4">
                                                    <select
                                                        value={college.status}
                                                        onChange={(e) => updateStatus(college.id, e.target.value)}
                                                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-bold outline-none"
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
                        )}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    )
}