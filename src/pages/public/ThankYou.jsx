import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function ThankYou() {
    const location = useLocation()
    const campaignTitle = location.state?.campaignTitle || 'Frint campaign'
    const targetUrl = location.state?.targetUrl

    return (
        <main className="frint-page flex min-h-screen items-center justify-center px-4 py-8">
            <section className="frint-card w-full max-w-md rounded-[28px] p-6 text-center sm:p-7">
                <img src="/logo.svg" alt="Frint" className="mx-auto h-10 w-auto" />

                <div className="mx-auto mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                    <CheckCircle2 size={30} />
                </div>

                <p className="frint-kicker mx-auto mt-6">Response saved</p>

                <h1 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--frint-text)]">
                    Thank you
                </h1>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 frint-muted">
                    Your response for <span className="font-semibold text-[var(--frint-text)]">{campaignTitle}</span> has been submitted.
                </p>

                <div className="mt-7 grid gap-3">
                    {targetUrl && (
                        <a
                            href={targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="frint-primary-btn flex items-center justify-center gap-2 px-5 py-3 text-sm"
                        >
                            Continue
                            <ArrowRight size={16} />
                        </a>
                    )}

                    <a
                        href="https://frint.in"
                        target="_blank"
                        rel="noreferrer"
                        className="frint-secondary-btn flex items-center justify-center px-5 py-3 text-sm"
                    >
                        Visit Frint
                    </a>

                    <Link
                        to="/login"
                        className="text-xs font-medium frint-muted"
                    >
                        Ambassador login
                    </Link>
                </div>
            </section>
        </main>
    )
}
