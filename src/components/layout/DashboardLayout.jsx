import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../ThemeToggle'
import { adminMenuItems, ambassadorMenuItems } from '../../config/menuItems'

export default function DashboardLayout({ role = 'admin', title, subtitle, children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const menuItems = role === 'admin' ? adminMenuItems : ambassadorMenuItems

    const logout = async () => {
        await supabase.auth.signOut()
        window.location.reload()
    }

    const SidebarContent = () => (
        <>
            <div className="px-2">
                <img src="/logo.svg" alt="Frint" className="h-12 w-auto" />

                <div className="mt-6 rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
                    <p className="text-sm font-black text-[var(--frint-text)]">
                        Ambassador Panel
                    </p>
                    <p className="mt-1 text-xs font-bold capitalize frint-muted">
                        {role}
                    </p>
                </div>
            </div>

            <nav className="mt-6 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                [
                                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition',
                                    isActive
                                        ? 'bg-[#0060f8] text-white'
                                        : 'text-[var(--frint-muted)] hover:bg-[var(--frint-hover)] hover:text-[var(--frint-text)]',
                                ].join(' ')
                            }
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </NavLink>
                    )
                })}
            </nav>
        </>
    )

    return (
        <div className="frint-page min-h-screen">
            <div className="flex min-h-screen">
                {/* Desktop sidebar */}
                <aside className="hidden w-[280px] shrink-0 border-r frint-border bg-[var(--frint-card)] p-5 lg:block">
                    <SidebarContent />
                </aside>

                {/* Main area */}
                <div className="min-w-0 flex-1">
                    <header className="sticky top-0 z-30 border-b frint-border bg-[var(--frint-card)]/90 backdrop-blur-xl">
                        <div className="flex min-h-[86px] items-center justify-between gap-4 px-5 lg:px-8">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="frint-secondary-btn flex h-10 w-10 items-center justify-center lg:hidden"
                                >
                                    <Menu size={18} />
                                </button>

                                <div className="min-w-0">
                                    <h1 className="truncate text-2xl font-black text-[var(--frint-text)]">
                                        {title}
                                    </h1>
                                    {subtitle && (
                                        <p className="mt-1 truncate text-sm font-bold frint-muted">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <ThemeToggle />

                                <button
                                    onClick={logout}
                                    className="frint-secondary-btn flex items-center gap-2 px-4 py-2.5 text-sm"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="px-5 py-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            {children || (
                                <div className="rounded-[28px] border frint-border bg-[var(--frint-card)] p-6">
                                    <p className="font-black text-red-600">
                                        No page content found inside DashboardLayout.
                                    </p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile sidebar */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    <aside className="relative h-full w-[86%] max-w-[330px] bg-[var(--frint-card)] p-5 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <img src="/logo.svg" alt="Frint" className="h-11 w-auto" />

                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="frint-secondary-btn flex h-10 w-10 items-center justify-center"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <SidebarContent />
                    </aside>
                </div>
            )}
        </div>
    )
}