import { useEffect, useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { createAmbassadorAccount } from '../../lib/adminApi'

const initialForm = {
    full_name: '',
    email: '',
    phone: '',
    college_id: '',
    password: '',
}

export default function CreateAmbassadorBox({ onCreated }) {
    const [form, setForm] = useState(initialForm)
    const [colleges, setColleges] = useState([])
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [success, setSuccess] = useState('')

    const loadColleges = async () => {
        const { data } = await supabase
            .from('colleges')
            .select('id, name, city, status')
            .eq('status', 'active')
            .order('name', { ascending: true })

        setColleges(data || [])
    }

    useEffect(() => {
        loadColleges()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')
        setSuccess('')

        try {
            await createAmbassadorAccount(form)

            setSuccess('Ambassador account created successfully.')
            setForm(initialForm)

            if (onCreated) {
                await onCreated()
            }
        } catch (error) {
            setMessage(error.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="frint-card mb-6 rounded-[30px] p-5">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
                    <UserPlus size={21} />
                </div>

                <div>
                    <h2 className="text-xl font-black text-[var(--frint-text)]">
                        Create ambassador login
                    </h2>
                    <p className="text-sm frint-muted">
                        Add account, role, college, and temporary password
                    </p>
                </div>
            </div>

            {message && (
                <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {message}
                </div>
            )}

            {success && (
                <div className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
                <input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Full name"
                    required
                />

                <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Email"
                    required
                />

                <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Phone optional"
                />

                <select
                    value={form.college_id}
                    onChange={(e) => setForm({ ...form, college_id: e.target.value })}
                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                >
                    <option value="">Select college optional</option>
                    {colleges.map((college) => (
                        <option key={college.id} value={college.id}>
                            {college.name}
                        </option>
                    ))}
                </select>

                <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none lg:col-span-2"
                    placeholder="Temporary password"
                    required
                />

                <button
                    type="submit"
                    disabled={saving}
                    className="frint-primary-btn flex items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60 lg:col-span-2"
                >
                    <Plus size={17} />
                    {saving ? 'Creating...' : 'Create ambassador account'}
                </button>
            </form>

            <p className="mt-4 text-xs font-bold frint-muted">
                Password is only used once for account creation. It is not stored in the panel.
            </p>
        </section>
    )
}