import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Mail, MapPin, Phone, Send, ShieldCheck, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'

const initialForm = {
    full_name: '',
    email: '',
    phone: '',
    college_name: '',
    city: '',
    message: '',
}

export default function RequestAccess() {
    const [form, setForm] = useState(initialForm)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const submitRequest = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        const { error } = await supabase.from('access_requests').insert({
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            college_name: form.college_name.trim() || null,
            city: form.city.trim() || null,
            message: form.message.trim() || null,
            role_requested: 'ambassador',
            status: 'pending',
        })

        setSubmitting(false)

        if (error) {
            setError(error.message)
            return
        }

        setSubmitted(true)
        setForm(initialForm)
    }

    return (
        <main className="frint-page relative min-h-screen overflow-hidden px-4 py-3 sm:py-4">
            <div className="pointer-events-none absolute left-[-180px] top-[-180px] h-[360px] w-[360px] rounded-full bg-[var(--frint-accent)]/18 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-200px] right-[-180px] h-[420px] w-[420px] rounded-full bg-[#0060f8]/10 blur-3xl" />

            <div className="relative mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-5xl flex-col">
                <header className="flex items-center justify-between gap-3 py-2">
                    <img src="/logo.svg" alt="Frint" className="h-10 w-auto object-contain sm:h-11" />
                    <ThemeToggle />
                </header>

                <div className="flex flex-1 items-center justify-center py-2">
                    <section className="grid w-full overflow-hidden rounded-[28px] border frint-border bg-[var(--frint-card)] shadow-sm lg:h-[min(680px,calc(100vh-92px))] lg:grid-cols-[0.82fr_1.18fr]">
                        <aside className="hidden min-h-0 border-r frint-border bg-[var(--frint-soft-card)] p-6 lg:block">
                            <div className="flex h-full flex-col justify-between gap-5">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border frint-border bg-[var(--frint-card)] px-3 py-1.5 text-xs font-semibold text-[var(--frint-accent)]">
                                        <ShieldCheck size={14} />
                                        Verified access
                                    </div>

                                    <h1 className="mt-6 max-w-sm text-[38px] font-semibold leading-[1.05] tracking-[-0.065em] text-[var(--frint-text)]">
                                        Request your ambassador login.
                                    </h1>

                                    <p className="mt-4 max-w-sm text-sm leading-6 frint-muted">
                                        This is not open signup. Frint admin reviews the request and creates your account after verification.
                                    </p>
                                </div>

                                <div className="rounded-[24px] border frint-border bg-[var(--frint-card)] p-4">
                                    <p className="text-sm font-semibold text-[var(--frint-text)]">What happens next?</p>
                                    <div className="mt-4 space-y-3 text-sm frint-muted">
                                        <p>1. Submit your basic details.</p>
                                        <p>2. Admin verifies your college and role.</p>
                                        <p>3. You receive login credentials.</p>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <section className="flex min-h-0 items-center justify-center p-5 sm:p-7 lg:p-8">
                            <div className="w-full max-w-[520px]">
                                <div className="mb-5 flex items-center justify-between gap-3 lg:justify-end">
                                    <Link to="/login" className="frint-secondary-btn flex items-center gap-2 px-4 py-2 text-sm">
                                        <ArrowLeft size={15} />
                                        Login
                                    </Link>
                                </div>

                                {submitted ? (
                                    <div className="mx-auto max-w-md py-6 text-center">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300">
                                            <CheckCircle2 size={32} />
                                        </div>

                                        <h1 className="mt-6 text-[30px] font-semibold tracking-[-0.06em] text-[var(--frint-text)]">Request sent</h1>
                                        <p className="mt-3 text-sm leading-6 frint-muted">Your request has been saved. Frint admin can review it and create your login after verification.</p>

                                        <Link to="/login" className="frint-primary-btn mt-7 inline-flex items-center justify-center px-5 py-3 text-sm">
                                            Back to login
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.06em] text-[var(--frint-text)] sm:text-[34px]">Request access</h1>
                                            <p className="mt-2 text-sm leading-6 frint-muted">Submit your details. Admin will verify and create your ambassador login.</p>
                                        </div>

                                        {error && (
                                            <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>
                                        )}

                                        <form onSubmit={submitRequest} className="mt-6 space-y-4">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <Field icon={UserRound} label="Full name">
                                                    <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full bg-transparent text-sm font-medium text-[var(--frint-text)] outline-none" placeholder="Your name" required />
                                                </Field>

                                                <Field icon={Phone} label="Phone">
                                                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-transparent text-sm font-medium text-[var(--frint-text)] outline-none" placeholder="Optional" />
                                                </Field>
                                            </div>

                                            <Field icon={Mail} label="Email address">
                                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-transparent text-sm font-medium text-[var(--frint-text)] outline-none" placeholder="you@example.com" required />
                                            </Field>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <Field icon={Building2} label="College">
                                                    <input value={form.college_name} onChange={(e) => setForm({ ...form, college_name: e.target.value })} className="w-full bg-transparent text-sm font-medium text-[var(--frint-text)] outline-none" placeholder="College name" />
                                                </Field>

                                                <Field icon={MapPin} label="City">
                                                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full bg-transparent text-sm font-medium text-[var(--frint-text)] outline-none" placeholder="City" />
                                                </Field>
                                            </div>

                                            <label className="block">
                                                <span className="mb-2 block text-sm font-semibold text-[var(--frint-text)]">Short note</span>
                                                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="frint-input min-h-[84px] resize-none" placeholder="Why do you want access? Optional" />
                                            </label>

                                            <button type="submit" disabled={submitting} className="frint-primary-btn flex w-full items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-70">
                                                <Send size={16} />
                                                {submitting ? 'Submitting...' : 'Submit request'}
                                            </button>
                                        </form>

                                        <p className="mt-5 text-center text-xs frint-muted">
                                            Already approved?{' '}
                                            <Link to="/login" className="font-semibold text-[var(--frint-accent)]">Login here</Link>
                                        </p>
                                    </>
                                )}
                            </div>
                        </section>
                    </section>
                </div>
            </div>
        </main>
    )
}

function Field({ icon: Icon, label, children }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--frint-text)]">{label}</span>
            <div className="flex items-center gap-3 rounded-[18px] border frint-border bg-[var(--frint-input)] px-4 py-3">
                <Icon size={17} className="shrink-0 frint-muted" />
                {children}
            </div>
        </label>
    )
}
