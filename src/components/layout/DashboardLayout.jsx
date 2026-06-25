import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../ThemeToggle'
import { adminMenuItems, ambassadorMenuItems } from '../../config/menuItems'

const mobilePriorityLabels = ['Dashboard', 'Campaigns', 'Leads', 'Tasks']

export default function DashboardLayout({
    role = 'admin',
    title,
    subtitle,
    children,
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const location = useLocation()

    const menuItems = role === 'admin' ? adminMenuItems : ambassadorMenuItems

    const mobilePrimaryItems = useMemo(() => {
        const preferred = menuItems.filter((item) =>
            mobilePriorityLabels.includes(item.label)
        )

        return preferred.length >= 3 ? preferred.slice(0, 4) : menuItems.slice(0, 4)
    }, [menuItems])

    const logout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    const roleLabel = role === 'admin' ? 'Admin workspace' : 'Ambassador workspace'

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
                            onClick={() => setMobileMenuOpen(false)}
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
                    className="frint-secondary-btn flex w-full items-center justify-center gap-2 px-4 py-2 text-sm"
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

                <div className="min-w-0 flex-1 overflow-x-hidden pb-[74px] lg:pb-0">
                    <header className="sticky top-0 z-30 border-b frint-border bg-[var(--frint-bg)]/92 backdrop-blur-xl">
                        <div className="flex min-h-[58px] items-center justify-between gap-3 px-4 lg:min-h-[68px] lg:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="frint-secondary-btn flex h-9 w-9 shrink-0 items-center justify-center p-0 lg:hidden"
                                    aria-label="Open menu"
                                >
                                    <Menu size={17} />
                                </button>

                                <div className="min-w-0">
                                    <h1 className="truncate text-[22px] font-semibold leading-tight tracking-[-0.04em] text-[var(--frint-text)] lg:text-[25px]">
                                        {title}
                                    </h1>

                                    {subtitle && (
                                        <p className="mt-0.5 max-w-[70vw] truncate text-[13px] font-medium frint-muted lg:max-w-none">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="hidden items-center gap-3 lg:flex">
                                <ThemeToggle />

                                <button
                                    onClick={logout}
                                    className="frint-secondary-btn flex items-center gap-2 px-4 py-2 text-sm"
                                >
                                    <LogOut size={15} />
                                    Logout
                                </button>
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

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close menu overlay"
                    />

                    <aside className="relative h-full w-[82%] max-w-[315px] bg-[var(--frint-card)] p-4 shadow-2xl">
                        <div className="mb-4 flex items-center justify-end">
                            <button
                                onClick={() => setMobileMenuOpen(false)}
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
                </div>
            </nav>
        </div>
    )
}