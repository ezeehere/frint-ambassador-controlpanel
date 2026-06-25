import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

function getSystemTheme() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
    }

    return 'light'
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('frint_theme') || 'system'
    })

    const [resolvedTheme, setResolvedTheme] = useState(() => {
        return theme === 'system' ? getSystemTheme() : theme
    })

    useEffect(() => {
        const applyTheme = () => {
            const finalTheme = theme === 'system' ? getSystemTheme() : theme

            setResolvedTheme(finalTheme)
            document.documentElement.setAttribute('data-theme', finalTheme)
            document.documentElement.style.colorScheme = finalTheme
            localStorage.setItem('frint_theme', theme)
        }

        applyTheme()

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        const handleSystemChange = () => {
            if (theme === 'system') {
                applyTheme()
            }
        }

        mediaQuery.addEventListener('change', handleSystemChange)

        return () => {
            mediaQuery.removeEventListener('change', handleSystemChange)
        }
    }, [theme])

    const value = useMemo(() => {
        return {
            theme,
            resolvedTheme,
            setTheme,
        }
    }, [theme, resolvedTheme])

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)

    if (!context) {
        throw new Error('useTheme must be used inside ThemeProvider')
    }

    return context
}