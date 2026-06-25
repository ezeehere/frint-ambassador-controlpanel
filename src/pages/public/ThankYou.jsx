import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

export default function ThankYou() {
    const location = useLocation()
    const campaignTitle = location.state?.campaignTitle || 'Frint campaign'
    const targetUrl = location.state?.targetUrl

    return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--frint-bg)] px-4">
            <section className="max-w-md rounded-[32px] border frint-border bg-[var(--frint-card)] p-8 text-center shadow-sm">
                <img src="/logo.svg" alt="Frint" className="mx-auto h-12" />

                <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
                    <CheckCircle2 size={34} />
                </div>

                <h1 className="mt-6 text-3xl font-black text-[var(--frint-text)]">
                    Submitted
                </h1>

                <p className="mt-3 text-sm font-bold frint-muted">
                    Your response for {campaignTitle} has been saved.
                </p>

                <div className="mt-7 flex flex-col gap-3">
                    {targetUrl && (
                        <a
                            href={targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="frint-primary-btn px-5 py-3 text-sm"
                        >
                            Continue
                        </a>
                    )}

                    <Link
                        to="/"
                        className="frint-secondary-btn px-5 py-3 text-sm"
                    >
                        Back to Frint Panel
                    </Link>
                </div>
            </section>
        </main>
    )
}