export default function StatusBadge({ status }) {
    const styles = {
        active: 'bg-green-50 text-green-700',
        pending: 'bg-amber-50 text-amber-700',
        suspended: 'bg-red-50 text-red-700',
        inactive: 'bg-slate-100 text-slate-600',
        draft: 'bg-slate-100 text-slate-600',
        completed: 'bg-blue-50 text-blue-700',
        paused: 'bg-amber-50 text-amber-700',
    }

    return (
        <span
            className={[
                'rounded-full px-3 py-1 text-xs font-black capitalize',
                styles[status] || 'bg-slate-100 text-slate-600',
            ].join(' ')}
        >
            {status || 'unknown'}
        </span>
    )
}