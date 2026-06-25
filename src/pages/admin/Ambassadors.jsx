import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, UserCheck } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'
import CreateAmbassadorBox from '../../components/admin/CreateAmbassadorBox'

export default function Ambassadors() {
    const [profiles, setProfiles] = useState([])
    const [colleges, setColleges] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState(null)
    const [search, setSearch] = useState('')
    const [message, setMessage] = useState('')

    const loadData = async () => {
        setLoading(true)
        setMessage('')

        const [{ data: profileData, error: profileError }, { data: collegeData, error: collegeError }] =
            await Promise.all([
                supabase
                    .from('profiles')
                    .select(`
            id,
            full_name,
            email,
            phone,
            role,
            status,
            college_id,
            created_at,
            colleges (
              id,
              name,
              city
            )
          `)
                    .order('created_at', { ascending: false }),

                supabase
                    .from('colleges')
                    .select('id, name, city, status')
                    .order('name', { ascending: true }),
            ])

        if (profileError) {
            setMessage(profileError.message)
        }

        if (collegeError) {
            setMessage(collegeError.message)
        }

        setProfiles(profileData || [])
        setColleges(collegeData || [])
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredProfiles = useMemo(() => {
        const value = search.trim().toLowerCase()

        if (!value) return profiles

        return profiles.filter((profile) => {
            return (
                profile.full_name?.toLowerCase().includes(value) ||
                profile.email?.toLowerCase().includes(value) ||
                profile.phone?.toLowerCase().includes(value) ||
                profile.colleges?.name?.toLowerCase().includes(value)
            )
        })
    }, [profiles, search])

    const updateProfile = async (profileId, updates) => {
        setSavingId(profileId)
        setMessage('')

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', profileId)

        if (error) {
            setMessage(error.message)
            setSavingId(null)
            return
        }

        await loadData()
        setSavingId(null)
    }

    return (
        <DashboardLayout
            role="admin"
            title="Ambassadors"
            subtitle="Assign roles, colleges, and account status"

        >

            <CreateAmbassadorBox onCreated={loadData} />
            <section className="frint-card rounded-[30px] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[var(--frint-text)]">
                            Ambassador accounts
                        </h2>
                        <p className="mt-1 text-sm frint-muted">
                            Manage users created in Supabase Auth
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex items-center gap-2 rounded-full border frint-border bg-[var(--frint-card)] px-4 py-2.5">
                            <Search size={17} className="frint-muted" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search user"
                                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 sm:w-64"
                            />
                        </div>

                        <button
                            onClick={loadData}
                            className="frint-secondary-btn flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {message}
                    </div>
                )}

                <div className="mt-5 rounded-[24px] border frint-border">
                    {loading ? (
                        <div className="p-8 text-center text-sm font-bold frint-muted">
                            Loading ambassadors...
                        </div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="p-5">
                            <EmptyState
                                title="No users found"
                                message="Create users in Supabase Auth first, then assign their role here."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[980px] w-full text-left">
                                <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                    <tr>
                                        <th className="px-4 py-4 text-xs font-black uppercase tracking-wide frint-muted">
                                            User
                                        </th>
                                        <th className="px-4 py-4 text-xs font-black uppercase tracking-wide frint-muted">
                                            Role
                                        </th>
                                        <th className="px-4 py-4 text-xs font-black uppercase tracking-wide frint-muted">
                                            College
                                        </th>
                                        <th className="px-4 py-4 text-xs font-black uppercase tracking-wide frint-muted">
                                            Status
                                        </th>
                                        <th className="px-4 py-4 text-xs font-black uppercase tracking-wide frint-muted">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredProfiles.map((profile) => {
                                        const saving = savingId === profile.id

                                        return (
                                            <tr key={profile.id} className="border-b frint-border last:border-b-0">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
                                                            <UserCheck size={20} />
                                                        </div>

                                                        <div>
                                                            <p className="font-black text-[var(--frint-text)]">
                                                                {profile.full_name || 'Unnamed user'}
                                                            </p>
                                                            <p className="mt-1 text-sm frint-muted">
                                                                {profile.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <select
                                                        value={profile.role || ''}
                                                        onChange={(e) =>
                                                            updateProfile(profile.id, {
                                                                role: e.target.value || null,
                                                            })
                                                        }
                                                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-bold outline-none"
                                                        disabled={saving}
                                                    >
                                                        <option value="">No role</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="ambassador">Ambassador</option>
                                                    </select>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <select
                                                        value={profile.college_id || ''}
                                                        onChange={(e) =>
                                                            updateProfile(profile.id, {
                                                                college_id: e.target.value || null,
                                                            })
                                                        }
                                                        className="max-w-[260px] rounded-2xl border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-bold outline-none"
                                                        disabled={saving}
                                                    >
                                                        <option value="">No college</option>
                                                        {colleges.map((college) => (
                                                            <option key={college.id} value={college.id}>
                                                                {college.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <StatusBadge status={profile.status} />
                                                </td>

                                                <td className="px-4 py-4">
                                                    <select
                                                        value={profile.status || 'pending'}
                                                        onChange={(e) =>
                                                            updateProfile(profile.id, {
                                                                status: e.target.value,
                                                            })
                                                        }
                                                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-bold outline-none"
                                                        disabled={saving}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="active">Active</option>
                                                        <option value="suspended">Suspended</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-5 rounded-[22px] bg-[var(--frint-soft-card)] p-4">
                    <p className="text-sm font-bold text-[var(--frint-text)]">
                        Current safe account flow
                    </p>
                    <p className="mt-1 text-sm frint-muted">
                        Create user in Supabase Auth, then assign role and college from this page. Secure in-app account creation will be added using a server function later.
                    </p>
                </div>
            </section>
        </DashboardLayout>
    )
}