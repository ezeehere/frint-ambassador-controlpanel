import { NavLink } from 'react-router-dom'
import { adminMenuItems, ambassadorMenuItems, roleLabels } from '../../config/menuItems'

export default function Sidebar({ role = 'admin' }) {
    const menuItems = role === 'admin' ? adminMenuItems : ambassadorMenuItems
    const RoleIcon = roleLabels[role]?.icon

    return (
        <aside className="hidden h-screen w-[280px] shrink-0 border-r frint-border bg-[var(--frint-card)] px-4 py-5 lg:block">
            <div className="flex h-full flex-col">
                <div className="px-3">
                    <img src="/logo.svg" alt="Frint" className="h-12 w-auto" />

                    <div className="mt-6 rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0060f8] text-white">
                                {RoleIcon && <RoleIcon size={20} />}
                            </div>

                            <div>
                                <p className="text-sm font-black text-[var(--frint-text)]">
                                    Control Panel
                                </p>
                                <p className="text-xs font-semibold frint-muted">
                                    {roleLabels[role]?.label}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="mt-6 flex-1 space-y-1 overflow-y-auto pr-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    [
                                        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition',
                                        isActive
                                            ? 'bg-[#0060f8] text-white shadow-lg shadow-blue-500/20'
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

                <div className="rounded-[22px] border frint-border bg-[var(--frint-soft-card)] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#70c0f8]">
                        Frint
                    </p>
                    <p className="mt-2 text-sm font-bold text-[var(--frint-text)]">
                        Ambassador Control Panel
                    </p>
                </div>
            </div>
        </aside>
    )
}