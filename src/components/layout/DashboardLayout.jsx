import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, MoreHorizontal, Settings, UserRound, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../ThemeToggle'
import { adminMenuItems, ambassadorMenuItems } from '../../config/menuItems'

const mobilePriorityLabels = ['Dashboard', 'Campaigns', 'Leads']

export default function DashboardLayout({
    role = 'admin',
    title,
    subtitle,
    children,
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [profileMenuOpen, setProfileMenuOpen] = useState(false)
    const [profile, setProfile] = useState(null)
    const location = useLocation()
    const navigate = useNavigate()
    const profileMenuRef = useRef(null)

    const menuItems = role === 'admin' ? adminMenuItems : ambassadorMenuItems

    const mobilePrimaryItems = useMemo(() => {
        return menuItems
            .filter((item) => mobilePriorityLabels.includes(item.label))
            .slice(0, 3)
    }, [menuItems])

    useEffect(() => {
        const loadProfile = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) return

            const { data } = await supabase
                .from('profiles')
                .select('full_name, email, role')
                .eq('id', user.id)
                .maybeSingle()

            setProfile(data || { email: user.email, role })
        }

        loadProfile()
    }, [role])

    useEffect(() => {
        const closeProfileMenu = (event) => {
            if (!profileMenuRef.current) return
            if (!profileMenuRef.current.contains(event.target)) {
                setProfileMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', closeProfileMenu)
        return () => document.removeEventListener('mousedown', closeProfileMenu)
    }, [])

    const logout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    const roleLabel = role === 'admin' ? 'Admin workspace' : 'Ambassador workspace'
    const displayName = profile?.full_name || profile?.email || 'Frint user'
    const initials = displayName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            <div>
                <div className="flex items-center justify-between gap-3">
                    <img src="/logo.svg" alt="Frint" className="h-8 w-auto" />

                    <span className="rounded-full border frint-border bg-[var(--frint-card)] px-3 py-1 text-[11px] font-semibold capitalize frint-muted">
                        {role}
                    </span>
                </div>

                <div className="mt-4 rounded-[18px] border frint-border bg-[var(--frint-soft-card)] px-4 py-3">
                    <p className="text-[13px] font-semibold text-[var(--frint-text)]">
                        Ambassador Panel
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium frint-muted">
                        {roleLabel}
                    </p>
                </div>
            </div>

            <nav className="frint-scrollbar mt-4 flex-1 space-y-1 overflow-y-auto pb-4">
                {menuItems.map((item) => {
                    const Icon = item.icon

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMenuOpen(false)}
                            className={({ isActive }) =>
                                [
                                    'flex items-center gap-3 rounded-[15px] px-3 py-2.5 text-[14px] font-semibold transition',
                                    isActive
                                        ? 'bg-[var(--frint-accent-soft)] text-[var(--frint-text)]'
                                        : 'text-[var(--frint-muted)] hover:bg-[var(--frint-hover)] hover:text-[var(--frint-text)]',
                                ].join(' ')
                            }
                        >
                            <Icon size={17} className="shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </NavLink>
                    )
                })}
            </nav>

            <div className="border-t frint-border pt-4">
                <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
                    <span className="text-[11px] font-semibold uppercase tracking-wide frint-muted">
                        Theme
                    </span>
                    <ThemeToggle />
                </div>

                <button
                    onClick={logout}
                    className="frint-danger-btn flex w-full items-center justify-center gap-2 px-4 py-2 text-sm"
                >
                    <LogOut size={15} />
                    Logout
                </button>
            </div>
        </div>
    )

    return (
        <div className="frint-page min-h-screen overflow-x-hidden">
            <div className="flex min-h-screen overflow-x-hidden">
                <aside className="hidden w-[236px] shrink-0 border-r frint-border bg-[var(--frint-card)] p-4 lg:block">
                    <div className="sticky top-4 h-[calc(100vh-2rem)]">
                        <SidebarContent />
                    </div>
                </aside>

                <div className="min-w-0 flex-1 overflow-x-hidden pb-[72px] lg:pb-0">
                    <header className="sticky top-0 z-30 border-b frint-border bg-[var(--frint-bg)]/92 backdrop-blur-xl">
                        <div className="flex min-h-[58px] items-center justify-between gap-3 px-4 lg:min-h-[68px] lg:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen(true)}
                                    className="frint-secondary-btn flex h-9 w-9 shrink-0 items-center justify-center p-0 lg:hidden"
                                    aria-label="Open menu"
                                >
                                    <Menu size={17} />
                                </button>

                                <div className="min-w-0">
                                    <h1 className="truncate text-[21px] font-semibold leading-tight tracking-[-0.04em] text-[var(--frint-text)] lg:text-[25px]">
                                        {title}
                                    </h1>

                                    {subtitle && (
                                        <p className="mt-0.5 max-w-[60vw] truncate text-[13px] font-medium frint-muted lg:max-w-none">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    onClick={logout}
                                    className="frint-danger-btn hidden items-center gap-2 px-3 py-2 text-xs sm:flex lg:hidden"
                                >
                                    <LogOut size={14} />
                                    Logout
                                </button>

                                <button
                                    onClick={logout}
                                    className="frint-danger-btn flex h-9 w-9 items-center justify-center p-0 sm:hidden"
                                    aria-label="Logout"
                                >
                                    <LogOut size={15} />
                                </button>

                                <div className="hidden items-center gap-3 lg:flex">
                                    <ThemeToggle />

                                    <div ref={profileMenuRef} className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setProfileMenuOpen((current) => !current)}
                                            className="frint-secondary-btn flex items-center gap-2 px-2 py-1.5 pr-3 text-sm"
                                        >
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--frint-accent-soft)] text-xs font-bold text-[var(--frint-text)]">
                                                {initials || 'F'}
                                            </span>
                                            <span className="max-w-[120px] truncate">{displayName}</span>
                                        </button>

                                        {profileMenuOpen && (
                                            <div className="absolute right-0 top-12 w-64 rounded-[20px] border frint-border bg-[var(--frint-card)] p-2 shadow-xl">
                                                <div className="px-3 py-3">
                                                    <p className="truncate text-sm font-semibold text-[var(--frint-text)]">
                                                        {displayName}
                                                    </p>
                                                    <p className="mt-0.5 text-xs capitalize frint-muted">
                                                        {roleLabel}
                                                    </p>
                                                </div>

                                                <div className="my-1 border-t frint-border" />

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProfileMenuOpen(false)
                                                        navigate(role === 'admin' ? '/admin/settings' : '/ambassador/profile')
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-[var(--frint-text)] hover:bg-[var(--frint-hover)]"
                                                >
                                                    <Settings size={15} />
                                                    Settings
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={logout}
                                                    className="mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-500/10"
                                                >
                                                    <LogOut size={15} />
                                                    Logout
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="w-full overflow-x-hidden px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
                        <div className="mx-auto w-full max-w-[1240px] overflow-x-hidden">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

            {menuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                        onClick={() => setMenuOpen(false)}
                        aria-label="Close menu overlay"
                    />

                    <aside className="relative h-full w-[82%] max-w-[315px] bg-[var(--frint-card)] p-4 shadow-2xl">
                        <div className="mb-4 flex items-center justify-end">
                            <button
                                onClick={() => setMenuOpen(false)}
                                className="frint-secondary-btn flex h-9 w-9 items-center justify-center p-0"
                                aria-label="Close menu"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <SidebarContent />
                    </aside>
                </div>
            )}

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t frint-border bg-[var(--frint-card)]/95 px-2 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1.5 backdrop-blur-xl lg:hidden">
                <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
                    {mobilePrimaryItems.map((item) => {
                        const Icon = item.icon
                        const active =
                            location.pathname === item.path ||
                            location.pathname.startsWith(`${item.path}/`)

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={[
                                    'flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-[10px] font-semibold transition',
                                    active
                                        ? 'bg-[var(--frint-accent-soft)] text-[var(--frint-text)]'
                                        : 'text-[var(--frint-muted)]',
                                ].join(' ')}
                            >
                                <Icon size={16} />
                                <span className="max-w-full truncate">{item.label}</span>
                            </NavLink>
                        )
                    })}

                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        className="flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-[10px] font-semibold text-[var(--frint-muted)]"
                    >
                        <MoreHorizontal size={16} />
                        More
                    </button>
                </div>
            </nav>
        </div>
    )
}
