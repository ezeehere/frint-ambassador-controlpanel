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

        if (preferred.length >= 3) {
            return preferred.slice(0, 4)
        }

        return menuItems.slice(0, 4)
    }, [menuItems])

    const logout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    const roleLabel = role === 'admin' ? 'Admin workspace' : 'Ambassador workspace'

    const SidebarContent = ({ compact = false }) => (
        <div className="flex h-full flex-col">
            <div>
                <div className="flex items-center justify-between gap-3 px-1">
                    <img src="/logo.svg" alt="Frint" className="h-9 w-auto" />

                    {!compact && (
                        <span className="rounded-full border frint-border bg-[var(--frint-card)] px-3 py-1 text-xs font-semibold capitalize frint-muted">
                            {role}
                        </span>
                    )}
                </div>

                <div className="mt-5 rounded-[20px] border frint-border bg-[var(--frint-soft-card)] px-4 py-3.5">
                    <p className="text-[13px] font-semibold text-[var(--frint-text)]">
                        Ambassador Panel
                    </p>
                    <p className="mt-0.5 text-xs font-medium frint-muted">
                        {roleLabel}
                    </p>
                </div>
            </div>

            <nav className="frint-scrollbar mt-5 flex-1 space-y-1 overflow-y-auto pb-4">
                {menuItems.map((item) => {
                    const Icon = item.icon

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                [
                                    'group flex items-center gap-3 rounded-[16px] px-3.5 py-2.5 text-[14px] font-semibold transition',
                                    isActive
                                        ? 'bg-[var(--frint-accent-soft)] text-[var(--frint-text)]'
                                        : 'text-[var(--frint-muted)] hover:bg-[var(--frint-hover)] hover:text-[var(--frint-text)]',
                                ].join(' ')
                            }
                        >
                            <Icon
                                size={17}
                                className="shrink-0 text-current"
                                strokeWidth={2}
                            />
                            <span className="truncate">{item.label}</span>
                        </NavLink>
                    )
                })}
            </nav>

            <div className="border-t frint-border pt-4">
                <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
                    <span className="text-xs font-semibold uppercase tracking-wide frint-muted">
                        Theme
                    </span>
                    <ThemeToggle />
                </div>

                <button
                    onClick={logout}
                    className="frint-secondary-btn flex w-full items-center justify-center gap-2 px-4 py-2 text-sm"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </div>
    )

    return (
        <div className="frint-page min-h-screen">
            <div className="flex min-h-screen">
                <aside className="hidden w-[248px] shrink-0 border-r frint-border bg-[var(--frint-card)]/94 p-4 lg:block">
                    <div className="sticky top-4 h-[calc(100vh-2rem)]">
                        <SidebarContent />
                    </div>
                </aside>

                <div className="min-w-0 flex-1 pb-20 lg:pb-0">
                    <header className="sticky top-0 z-30 border-b frint-border bg-[var(--frint-bg)]/88 backdrop-blur-xl">
                        <div className="flex min-h-[64px] items-center justify-between gap-3 px-4 sm:px-5 lg:min-h-[70px] lg:px-7">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="frint-secondary-btn flex h-10 w-10 shrink-0 items-center justify-center p-0 lg:hidden"
                                    aria-label="Open menu"
                                >
                                    <Menu size={18} />
                                </button>

                                <div className="min-w-0">
                                    <p className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--frint-accent)] sm:block">
                                        Frint
                                    </p>

                                    <h1 className="truncate text-[20px] font-semibold leading-tight tracking-[-0.035em] text-[var(--frint-text)] lg:text-[25px]">
                                        {title}
                                    </h1>

                                    {subtitle && (
                                        <p className="mt-0.5 max-w-[58vw] truncate text-xs font-medium frint-muted sm:max-w-none sm:text-sm">
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

                    <main className="px-4 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-7">
                        <div className="mx-auto w-full max-w-[1320px]">
                            {children || (
                                <div className="frint-card rounded-[24px] p-5">
                                    <p className="font-semibold text-red-600">
                                        No page content found inside DashboardLayout.
                                    </p>
                                </div>
                            )}
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

                    <aside className="relative h-full w-[88%] max-w-[340px] bg-[var(--frint-card)] p-4 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <img src="/logo.svg" alt="Frint" className="h-9 w-auto" />

                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="frint-secondary-btn flex h-10 w-10 items-center justify-center p-0"
                                aria-label="Close menu"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <SidebarContent compact />
                    </aside>
                </div>
            )}

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t frint-border bg-[var(--frint-card)]/94 px-2 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-2 backdrop-blur-xl lg:hidden">
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
                                    'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition',
                                    active
                                        ? 'bg-[var(--frint-accent-soft)] text-[var(--frint-text)]'
                                        : 'text-[var(--frint-muted)] hover:bg-[var(--frint-hover)] hover:text-[var(--frint-text)]',
                                ].join(' ')}
                            >
                                <Icon size={17} />
                                <span className="max-w-full truncate">{item.label}</span>
                            </NavLink>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}