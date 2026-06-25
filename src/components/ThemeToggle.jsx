import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const options = [
    {
        value: 'light',
        label: 'Light',
        icon: Sun,
    },
    {
        value: 'system',
        label: 'System',
        icon: Monitor,
    },
    {
        value: 'dark',
        label: 'Dark',
        icon: Moon,
    },
]

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="frint-toggle">
            {options.map((option) => {
                const Icon = option.icon
                const active = theme === option.value

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => setTheme(option.value)}
                        className={active ? 'frint-toggle-btn active' : 'frint-toggle-btn'}
                        title={option.label}
                        aria-label={`Switch to ${option.label} theme`}
                    >
                        <Icon size={16} />
                    </button>
                )
            })}
        </div>
    )
}