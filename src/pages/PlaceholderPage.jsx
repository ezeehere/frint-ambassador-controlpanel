import DashboardLayout from '../components/layout/DashboardLayout'

export default function PlaceholderPage({ role, title, subtitle }) {
    return (
        <DashboardLayout role={role} title={title} subtitle={subtitle}>
            <section className="frint-card rounded-[30px] p-8">
                <h2 className="text-2xl font-black text-[var(--frint-text)]">
                    {title}
                </h2>
                <p className="mt-3 max-w-xl text-sm frint-muted">
                    This page is added to the route system. We will connect the full functionality after ambassadors and colleges are stable.
                </p>
            </section>
        </DashboardLayout>
    )
}