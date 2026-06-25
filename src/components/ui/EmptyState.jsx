export default function EmptyState({ title, message }) {
    return (
        <div className="rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-8 text-center">
            <h3 className="text-lg font-black text-[var(--frint-text)]">
                {title}
            </h3>
            <p className="mt-2 text-sm frint-muted">
                {message}
            </p>
        </div>
    )
}