import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const initialForm = {
    student_name: '',
    email: '',
    phone: '',
    college_id: '',
    course: '',
    year: '',
    city: '',
    interest: 'Internship',
    skills: '',
    resume_link: '',
    team_name: '',
    feedback: '',
    rating: '',
    why_join: '',
}

function formTitle(formType) {
    const titles = {
        basic_student_form: 'Student details',
        internship_form: 'Internship interest form',
        event_form: 'Event registration form',
        feedback_form: 'Feedback form',
        ambassador_application_form: 'Ambassador application form',
        none: 'Campaign form',
    }

    return titles[formType] || 'Student details'
}

export default function CampaignLeadPage() {
    const { refCode } = useParams()
    const navigate = useNavigate()

    const [assignment, setAssignment] = useState(null)
    const [campaign, setCampaign] = useState(null)
    const [colleges, setColleges] = useState([])
    const [form, setForm] = useState(initialForm)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const loadPage = async () => {
        setLoading(true)
        setError('')

        const assignmentResult = await supabase
            .from('ambassador_campaigns')
            .select('id, ambassador_id, campaign_id, ref_code, status')
            .eq('ref_code', refCode)
            .eq('status', 'active')
            .maybeSingle()

        if (assignmentResult.error) {
            setError(assignmentResult.error.message)
            setLoading(false)
            return
        }

        if (!assignmentResult.data) {
            setError('This referral link is not active.')
            setLoading(false)
            return
        }

        const campaignResult = await supabase
            .from('campaigns')
            .select(`
        id,
        title,
        description,
        type,
        status,
        action_mode,
        form_type,
        external_url,
        target_url,
        primary_action
      `)
            .eq('id', assignmentResult.data.campaign_id)
            .eq('status', 'active')
            .maybeSingle()

        if (campaignResult.error) {
            setError(campaignResult.error.message)
            setLoading(false)
            return
        }

        if (!campaignResult.data) {
            setError('This campaign is not active right now.')
            setLoading(false)
            return
        }

        const collegesResult = await supabase
            .from('colleges')
            .select('id, name, city')
            .eq('status', 'active')
            .order('name', { ascending: true })

        if (collegesResult.error) {
            setError(collegesResult.error.message)
            setLoading(false)
            return
        }

        setAssignment(assignmentResult.data)
        setCampaign(campaignResult.data)
        setColleges(collegesResult.data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadPage()
    }, [refCode])

    const normalizeExternalUrl = (url) => {
        if (!url) return ''

        const cleanedUrl = url.trim()

        if (
            cleanedUrl.startsWith('http://') ||
            cleanedUrl.startsWith('https://')
        ) {
            return cleanedUrl
        }

        return `https://${cleanedUrl}`
    }

    const getExternalUrl = () => {
        return normalizeExternalUrl(campaign?.external_url || campaign?.target_url || '')
    }

    const handleExternalContinue = () => {
        const url = getExternalUrl()

        if (!url) {
            setError('External link is missing for this campaign.')
            return
        }

        window.open(url, '_blank', 'noreferrer')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        if (!assignment || !campaign) {
            setError('Campaign data is missing. Refresh and try again.')
            setSaving(false)
            return
        }

        const rawAnswers = {
            skills: form.skills.trim() || null,
            resume_link: form.resume_link.trim() || null,
            team_name: form.team_name.trim() || null,
            feedback: form.feedback.trim() || null,
            rating: form.rating.trim() || null,
            why_join: form.why_join.trim() || null,
        }

        const leadResult = await supabase.from('leads').insert({
            campaign_id: campaign.id,
            ambassador_id: assignment.ambassador_id,
            college_id: form.college_id || null,
            student_name: form.student_name.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim(),
            course: form.course.trim() || null,
            year: form.year.trim() || null,
            city: form.city.trim() || null,
            interest: form.interest,
            source: 'referral_form',
            status: 'new',
            form_type: campaign.form_type,
            raw_answers: rawAnswers,
        })

        if (leadResult.error) {
            setError(leadResult.error.message)
            setSaving(false)
            return
        }

        navigate('/thank-you', {
            state: {
                campaignTitle: campaign.title,
                targetUrl: campaign.action_mode === 'hybrid' ? getExternalUrl() : null,
            },
        })
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[var(--frint-bg)] px-4">
                <div className="rounded-[28px] border frint-border bg-[var(--frint-card)] p-8 text-center">
                    <Loader2 className="mx-auto animate-spin text-[#0060f8]" size={28} />
                    <p className="mt-4 text-sm font-black frint-muted">
                        Loading form...
                    </p>
                </div>
            </main>
        )
    }

    if (error && !campaign) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[var(--frint-bg)] px-4">
                <div className="max-w-md rounded-[28px] border frint-border bg-[var(--frint-card)] p-8 text-center">
                    <img src="/logo.svg" alt="Frint" className="mx-auto h-12" />
                    <h1 className="mt-6 text-2xl font-black text-[var(--frint-text)]">
                        Link unavailable
                    </h1>
                    <p className="mt-3 text-sm font-bold frint-muted">
                        {error}
                    </p>
                </div>
            </main>
        )
    }

    if (campaign?.action_mode === 'tracking_only') {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[var(--frint-bg)] px-4">
                <section className="max-w-md rounded-[32px] border frint-border bg-[var(--frint-card)] p-8 text-center">
                    <img src="/logo.svg" alt="Frint" className="mx-auto h-12" />
                    <h1 className="mt-7 text-3xl font-black text-[var(--frint-text)]">
                        Internal campaign
                    </h1>
                    <p className="mt-3 text-sm font-bold frint-muted">
                        This campaign is used for internal tracking and does not have a public form.
                    </p>
                </section>
            </main>
        )
    }

    if (campaign?.action_mode === 'external_link') {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[var(--frint-bg)] px-4">
                <section className="max-w-md rounded-[32px] border frint-border bg-[var(--frint-card)] p-8 text-center">
                    <img src="/logo.svg" alt="Frint" className="mx-auto h-12" />

                    <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#0060f8]">
                        <ExternalLink size={32} />
                    </div>

                    <h1 className="mt-6 text-3xl font-black text-[var(--frint-text)]">
                        {campaign.title}
                    </h1>

                    <p className="mt-3 text-sm font-bold frint-muted">
                        Continue to the official Frint campaign link.
                    </p>

                    {error && (
                        <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleExternalContinue}
                        className="frint-primary-btn mt-7 flex w-full items-center justify-center gap-2 px-5 py-3 text-sm"
                    >
                        Continue
                        <ArrowRight size={17} />
                    </button>
                </section>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[var(--frint-bg)] px-4 py-8">
            <div className="mx-auto max-w-5xl">
                <header className="mb-8 flex items-center justify-between">
                    <img src="/logo.svg" alt="Frint" className="h-12 w-auto" />

                    <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-[#0060f8]">
                        Frint Form
                    </span>
                </header>

                <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                    <section className="frint-card rounded-[30px] p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0060f8]">
                            <CheckCircle2 size={23} />
                        </div>

                        <h1 className="mt-6 text-3xl font-black text-[var(--frint-text)]">
                            {campaign.title}
                        </h1>

                        <p className="mt-3 text-sm font-bold frint-muted">
                            Fill the form to register your interest through Frint.
                        </p>

                        {campaign.description && (
                            <p className="mt-5 rounded-[22px] bg-[var(--frint-soft-card)] p-4 text-sm font-bold frint-muted">
                                {campaign.description}
                            </p>
                        )}

                        {campaign.action_mode === 'hybrid' && (
                            <p className="mt-5 rounded-[22px] bg-blue-50 p-4 text-sm font-bold text-[#0060f8]">
                                After submitting, you will get the next link.
                            </p>
                        )}
                    </section>

                    <section className="frint-card rounded-[30px] p-6">
                        <h2 className="text-xl font-black text-[var(--frint-text)]">
                            {formTitle(campaign.form_type)}
                        </h2>

                        {error && (
                            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                            <input
                                value={form.student_name}
                                onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                                className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="Full name"
                                required
                            />

                            <input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="Phone number"
                                required
                            />

                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="Email optional"
                            />

                            <select
                                value={form.college_id}
                                onChange={(e) => setForm({ ...form, college_id: e.target.value })}
                                className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                            >
                                <option value="">Select college optional</option>
                                {colleges.map((college) => (
                                    <option key={college.id} value={college.id}>
                                        {college.name}
                                    </option>
                                ))}
                            </select>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <input
                                    value={form.course}
                                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Course"
                                />

                                <input
                                    value={form.year}
                                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Year / semester"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <input
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="City"
                                />

                                <select
                                    value={form.interest}
                                    onChange={(e) => setForm({ ...form, interest: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                >
                                    <option>Internship</option>
                                    <option>Job</option>
                                    <option>Workshop</option>
                                    <option>Event</option>
                                    <option>Hackathon</option>
                                    <option>Startup Exposure</option>
                                </select>
                            </div>

                            {campaign.form_type === 'internship_form' && (
                                <>
                                    <textarea
                                        value={form.skills}
                                        onChange={(e) => setForm({ ...form, skills: e.target.value })}
                                        className="min-h-20 rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                        placeholder="Skills"
                                    />

                                    <input
                                        value={form.resume_link}
                                        onChange={(e) => setForm({ ...form, resume_link: e.target.value })}
                                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                        placeholder="Resume link optional"
                                    />
                                </>
                            )}

                            {campaign.form_type === 'event_form' && (
                                <input
                                    value={form.team_name}
                                    onChange={(e) => setForm({ ...form, team_name: e.target.value })}
                                    className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Team name optional"
                                />
                            )}

                            {campaign.form_type === 'feedback_form' && (
                                <>
                                    <select
                                        value={form.rating}
                                        onChange={(e) => setForm({ ...form, rating: e.target.value })}
                                        className="rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                        required
                                    >
                                        <option value="">Rating</option>
                                        <option value="5">5 - Excellent</option>
                                        <option value="4">4 - Good</option>
                                        <option value="3">3 - Average</option>
                                        <option value="2">2 - Poor</option>
                                        <option value="1">1 - Bad</option>
                                    </select>

                                    <textarea
                                        value={form.feedback}
                                        onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                                        className="min-h-24 rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                        placeholder="Your feedback"
                                        required
                                    />
                                </>
                            )}

                            {campaign.form_type === 'ambassador_application_form' && (
                                <textarea
                                    value={form.why_join}
                                    onChange={(e) => setForm({ ...form, why_join: e.target.value })}
                                    className="min-h-24 rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Why do you want to join as a Frint ambassador?"
                                    required
                                />
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="frint-primary-btn mt-2 px-5 py-3 text-sm disabled:opacity-60"
                            >
                                {saving ? 'Submitting...' : 'Submit'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </main>
    )
}