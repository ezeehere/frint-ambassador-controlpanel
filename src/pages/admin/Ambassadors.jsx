import { Fragment, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, UserCheck } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'
import CreateAmbassadorBox from '../../components/admin/CreateAmbassadorBox'
import AmbassadorAccountActions from '../../components/admin/AmbassadorAccountActions'

function AmbassadorMobileCard({ profile, colleges, saving, onUpdate, onReload }) {
    return (
        <article className="rounded-[20px] border frint-border bg-[var(--frint-card)] p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--frint-accent-soft)] text-[var(--frint-blue)]">
                    <UserCheck size={19} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="truncate text-[16px] font-semibold text-[var(--frint-text)]">
                                {profile.full_name || 'Unnamed user'}
                            </h3>
                            <p className="mt-0.5 truncate text-sm font-medium frint-muted">
                                {profile.email}
                            </p>
                        </div>

                        <StatusBadge status={profile.status} />
                    </div>

                    <p className="mt-2 truncate text-sm frint-muted">
                        {profile.colleges?.name || 'No college'}
                    </p>
                </div>
            </div>

            <div className="mt-4 grid gap-2">
                <select
                    value={profile.role || ''}
                    onChange={(e) =>
                        onUpdate(profile.id, {
                            role: e.target.value || null,
                        })
                    }
                    className="frint-input"
                    disabled={saving}
                >
                    <option value="">No role</option>
                    <option value="admin">Admin</option>
                    <option value="ambassador">Ambassador</option>
                </select>

                <select
                    value={profile.college_id || ''}
                    onChange={(e) =>
                        onUpdate(profile.id, {
                            college_id: e.target.value || null,
                        })
                    }
                    className="frint-input"
                    disabled={saving}
                >
                    <option value="">No college</option>
                    {colleges.map((college) => (
                        <option key={college.id} value={college.id}>
                            {college.name}
                        </option>
                    ))}
                </select>

                <select
                    value={profile.status || 'pending'}
                    onChange={(e) =>
                        onUpdate(profile.id, {
                            status: e.target.value,
                        })
                    }
                    className="frint-input"
                    disabled={saving}
                >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            {profile.role === 'ambassador' && (
                <details className="mt-3 rounded-2xl bg-[var(--frint-soft-card)] p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-[var(--frint-text)]">
                        Account controls
                    </summary>

                    <div className="mt-3 min-w-0 overflow-hidden [&_button]:w-full [&_input]:w-full">
                        <AmbassadorAccountActions ambassador={profile} onUpdated={onReload} />
                    </div>
                </details>
            )}
        </article>
    )
}

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
            <div className="space-y-4">
                <div className="[&_section]:rounded-[24px] [&_section]:p-4 sm:[&_section]:p-5">
                    <CreateAmbassadorBox onCreated={loadData} />
                </div>

                <section className="frint-card rounded-[24px] p-4 sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--frint-text)]">
                                Ambassador accounts
                            </h2>
                            <p className="mt-0.5 text-sm frint-muted">
                                {filteredProfiles.length} users
                            </p>
                        </div>

                        <div className="grid gap-2 sm:flex sm:items-center">
                            <div className="flex min-w-0 items-center gap-2 rounded-full border frint-border bg-[var(--frint-card)] px-3 py-2">
                                <Search size={16} className="shrink-0 frint-muted" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search user"
                                    className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 sm:w-64"
                                />
                            </div>

                            <button
                                onClick={loadData}
                                className="frint-secondary-btn flex items-center justify-center gap-2 px-4 py-2 text-sm"
                            >
                                <RefreshCw size={15} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                            {message}
                        </div>
                    )}

                    {loading ? (
                        <div className="mt-4 rounded-[20px] border frint-border p-6 text-center text-sm font-medium frint-muted">
                            Loading ambassadors...
                        </div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="mt-4">
                            <EmptyState
                                title="No users found"
                                message="Create an ambassador account, then assign role and college."
                            />
                        </div>
                    ) : (
                        <>
                            <div className="mt-4 grid gap-3 md:hidden">
                                {filteredProfiles.map((profile) => (
                                    <AmbassadorMobileCard
                                        key={profile.id}
                                        profile={profile}
                                        colleges={colleges}
                                        saving={savingId === profile.id}
                                        onUpdate={updateProfile}
                                        onReload={loadData}
                                    />
                                ))}
                            </div>

                            <div className="mt-4 hidden overflow-hidden rounded-[22px] border frint-border md:block">
                                <div className="frint-table-wrap">
                                    <table className="w-full min-w-[920px] text-left text-sm">
                                        <thead className="border-b frint-border bg-[var(--frint-soft-card)]">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">User</th>
                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">Role</th>
                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">College</th>
                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">Status</th>
                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide frint-muted">Action</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredProfiles.map((profile) => {
                                                const saving = savingId === profile.id

                                                return (
                                                    <Fragment key={profile.id}>
                                                        <tr className="border-b frint-border">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--frint-accent-soft)] text-[var(--frint-blue)]">
                                                                        <UserCheck size={18} />
                                                                    </div>

                                                                    <div className="min-w-0">
                                                                        <p className="truncate font-semibold text-[var(--frint-text)]">
                                                                            {profile.full_name || 'Unnamed user'}
                                                                        </p>
                                                                        <p className="mt-0.5 truncate text-sm frint-muted">
                                                                            {profile.email}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                <select
                                                                    value={profile.role || ''}
                                                                    onChange={(e) =>
                                                                        updateProfile(profile.id, {
                                                                            role: e.target.value || null,
                                                                        })
                                                                    }
                                                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-medium outline-none"
                                                                    disabled={saving}
                                                                >
                                                                    <option value="">No role</option>
                                                                    <option value="admin">Admin</option>
                                                                    <option value="ambassador">Ambassador</option>
                                                                </select>
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                <select
                                                                    value={profile.college_id || ''}
                                                                    onChange={(e) =>
                                                                        updateProfile(profile.id, {
                                                                            college_id: e.target.value || null,
                                                                        })
                                                                    }
                                                                    className="max-w-[230px] rounded-2xl border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-medium outline-none"
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

                                                            <td className="px-4 py-3">
                                                                <StatusBadge status={profile.status} />
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                <select
                                                                    value={profile.status || 'pending'}
                                                                    onChange={(e) =>
                                                                        updateProfile(profile.id, {
                                                                            status: e.target.value,
                                                                        })
                                                                    }
                                                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-3 py-2 text-sm font-medium outline-none"
                                                                    disabled={saving}
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="active">Active</option>
                                                                    <option value="suspended">Suspended</option>
                                                                </select>
                                                            </td>
                                                        </tr>

                                                        {profile.role === 'ambassador' && (
                                                            <tr className="border-b frint-border bg-[var(--frint-soft-card)]/30">
                                                                <td colSpan={5} className="px-4 pb-4 pt-1">
                                                                    <details>
                                                                        <summary className="cursor-pointer text-sm font-semibold text-[var(--frint-text)]">
                                                                            Account controls
                                                                        </summary>
                                                                        <div className="mt-3">
                                                                            <AmbassadorAccountActions
                                                                                ambassador={profile}
                                                                                onUpdated={loadData}
                                                                            />
                                                                        </div>
                                                                    </details>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Fragment>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </DashboardLayout>
    )
}
