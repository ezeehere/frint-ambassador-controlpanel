import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Loader2, ShieldAlert } from 'lucide-react'
import { supabase } from '../../lib/supabase'


const initialForm = {
    student_name: '',
    email: '',
    phone: '',
    college_id: '',
    course: '',
    year: '',
    city: '',
    interest: '',
    skills: '',
    resume_link: '',
    team_name: '',
    rating: '',
    feedback: '',
    why_join: '',
}

function normalizeExternalUrl(url) {
    if (!url) return ''

    const cleanedUrl = url.trim()

    if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
        return cleanedUrl
    }

    return `https://${cleanedUrl}`
}

export default function CampaignLeadPage() {
    const { refCode } = useParams()
    const navigate = useNavigate()

    const [assignment, setAssignment] = useState(null)
    const [campaign, setCampaign] = useState(null)
    const [colleges, setColleges] = useState([])
    const [settings, setSettings] = useState(null)
    const [customAnswers, setCustomAnswers] = useState({})
    const [form, setForm] = useState(initialForm)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState('')

    const loadPage = async () => {
        setLoading(true)
        setMessage('')

        const settingsResult = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', true)
            .maybeSingle()

        const assignmentResult = await supabase
            .from('ambassador_campaigns')
            .select(`
        id,
        ref_code,
        ambassador_id,
        status,
        campaigns (
          id,
          title,
          description,
          type,
          status,
          action_mode,
          form_type,
          form_schema,
          external_url,
          target_url,
          primary_action
        )
      `)
            .eq('ref_code', refCode)
            .eq('status', 'active')
            .maybeSingle()

        const collegesResult = await supabase
            .from('colleges')
            .select('id, name, city, status')
            .eq('status', 'active')
            .order('name', { ascending: true })

        if (settingsResult.error) {
            setMessage(settingsResult.error.message)
            setLoading(false)
            return
        }

        if (assignmentResult.error) {
            setMessage(assignmentResult.error.message)
            setLoading(false)
            return
        }

        if (!assignmentResult.data || assignmentResult.data.campaigns?.status !== 'active') {
            setMessage('This referral link is not active.')
            setLoading(false)
            return
        }

        if (collegesResult.error) {
            setMessage(collegesResult.error.message)
            setLoading(false)
            return
        }

        setSettings(settingsResult.data || null)
        setAssignment(assignmentResult.data)
        setCampaign(assignmentResult.data.campaigns)
        setColleges(collegesResult.data || [])
        setLoading(false)
    }

    useEffect(() => {
        loadPage()
    }, [refCode])

    const getExternalUrl = () => {
        return normalizeExternalUrl(campaign?.external_url || campaign?.target_url || '')
    }

    const submitLead = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setMessage('')

        const rawAnswers = {
            skills: form.skills,
            resume_link: form.resume_link,
            team_name: form.team_name,
            rating: form.rating,
            feedback: form.feedback,
            why_join: form.why_join,
            custom_answers: customAnswers,
        }

        const result = await supabase
            .from('leads')
            .insert({
                campaign_id: campaign.id,
                ambassador_id: assignment.ambassador_id,
                student_name: form.student_name.trim(),
                email: form.email.trim() || null,
                phone: form.phone.trim(),
                college_id: form.college_id || null,
                course: form.course.trim() || null,
                year: form.year.trim() || null,
                city: form.city.trim() || null,
                interest: form.interest.trim() || null,
                status: 'new',
                form_type: campaign.form_type || 'basic_student_form',
                raw_answers: rawAnswers,
            })

        if (result.error) {
            setMessage(result.error.message)
            setSubmitting(false)
            return
        }

        const targetUrl = getExternalUrl()

        navigate('/thank-you', {
            state: {
                campaignTitle: campaign.title,
                targetUrl:
                    campaign.action_mode === 'hybrid' && targetUrl
                        ? targetUrl
                        : '',
            },
        })
    }

    const renderExtraFields = () => {
        if (campaign?.form_type === 'internship_form') {
            return (
                <>
                    <input
                        value={form.skills}
                        onChange={(e) => setForm({ ...form, skills: e.target.value })}
                        className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                        placeholder="Skills, example: React, Python, Canva"
                    />

                    <input
                        value={form.resume_link}
                        onChange={(e) => setForm({ ...form, resume_link: e.target.value })}
                        className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                        placeholder="Resume link optional"
                    />
                </>
            )
        }

        if (campaign?.form_type === 'event_form') {
            return (
                <input
                    value={form.team_name}
                    onChange={(e) => setForm({ ...form, team_name: e.target.value })}
                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Team name optional"
                />
            )
        }

        if (campaign?.form_type === 'feedback_form') {
            return (
                <>
                    <select
                        value={form.rating}
                        onChange={(e) => setForm({ ...form, rating: e.target.value })}
                        className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    >
                        <option value="">Select rating</option>
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Poor</option>
                        <option value="1">1 - Very poor</option>
                    </select>

                    <textarea
                        value={form.feedback}
                        onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                        className="min-h-24 w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                        placeholder="Write your feedback"
                    />
                </>
            )
        }

        if (campaign?.form_type === 'ambassador_application_form') {
            return (
                <textarea
                    value={form.why_join}
                    onChange={(e) => setForm({ ...form, why_join: e.target.value })}
                    className="min-h-24 w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Why do you want to become a Frint ambassador?"
                />
            )
        }

        return null
    }

    if (loading) {
        return (
            <div className="frint-page flex min-h-screen items-center justify-center p-4">
                <div className="frint-card flex items-center gap-3 rounded-[28px] px-6 py-5">
                    <Loader2 className="animate-spin text-[#0060f8]" size={22} />
                    <p className="text-sm font-black frint-muted">Loading form...</p>
                </div>
            </div>
        )
    }

    if (settings?.maintenance_mode) {
        return (
            <div className="frint-page flex min-h-screen items-center justify-center p-4">
                <section className="frint-card w-full max-w-md rounded-[32px] p-7 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <ShieldAlert size={27} />
                    </div>

                    <img
                        src="/logo.svg"
                        alt="Frint"
                        className="mx-auto mt-5 h-10 w-auto object-contain"
                    />

                    <h1 className="mt-5 text-2xl font-black text-[var(--frint-text)]">
                        Forms are paused
                    </h1>

                    <p className="mt-3 text-sm font-bold leading-6 frint-muted">
                        Frint is currently updating the ambassador system. Please try again later.
                    </p>

                    {(settings.support_email || settings.support_whatsapp) && (
                        <div className="mt-5 rounded-[22px] bg-[var(--frint-soft-card)] p-4 text-sm font-bold frint-muted">
                            {settings.support_email && <p>{settings.support_email}</p>}
                            {settings.support_whatsapp && <p>{settings.support_whatsapp}</p>}
                        </div>
                    )}
                </section>
            </div>
        )
    }

    if (message || !campaign) {
        return (
            <div className="frint-page flex min-h-screen items-center justify-center p-4">
                <section className="frint-card w-full max-w-md rounded-[32px] p-7 text-center">
                    <img
                        src="/logo.svg"
                        alt="Frint"
                        className="mx-auto h-10 w-auto object-contain"
                    />

                    <h1 className="mt-5 text-2xl font-black text-[var(--frint-text)]">
                        Link unavailable
                    </h1>

                    <p className="mt-3 text-sm font-bold leading-6 frint-muted">
                        {message || 'This campaign link is not available right now.'}
                    </p>
                </section>
            </div>
        )
    }

    const externalUrl = getExternalUrl()

    if (campaign.action_mode === 'external_link') {
        return (
            <div className="frint-page flex min-h-screen items-center justify-center p-4">
                <section className="frint-card w-full max-w-lg rounded-[32px] p-7">
                    <img
                        src="/logo.svg"
                        alt="Frint"
                        className="h-10 w-auto object-contain"
                    />

                    <h1 className="mt-6 text-3xl font-black text-[var(--frint-text)]">
                        {campaign.title}
                    </h1>

                    {campaign.description && (
                        <p className="mt-3 text-sm font-bold leading-6 frint-muted">
                            {campaign.description}
                        </p>
                    )}

                    {settings?.public_form_notice && (
                        <div className="mt-5 rounded-[22px] bg-[var(--frint-soft-card)] p-4 text-sm font-bold frint-muted">
                            {settings.public_form_notice}
                        </div>
                    )}

                    <button
                        onClick={() => window.location.href = externalUrl}
                        className="frint-primary-btn mt-6 flex w-full items-center justify-center gap-2 px-5 py-3 text-sm"
                    >
                        Continue
                        <ArrowRight size={17} />
                    </button>
                </section>
            </div>
        )
    }

    if (campaign.action_mode === 'tracking_only') {
        return (
            <div className="frint-page flex min-h-screen items-center justify-center p-4">
                <section className="frint-card w-full max-w-md rounded-[32px] p-7 text-center">
                    <img
                        src="/logo.svg"
                        alt="Frint"
                        className="mx-auto h-10 w-auto object-contain"
                    />

                    <h1 className="mt-5 text-2xl font-black text-[var(--frint-text)]">
                        Internal campaign
                    </h1>

                    <p className="mt-3 text-sm font-bold leading-6 frint-muted">
                        This campaign is for internal tracking only.
                    </p>
                </section>
            </div>
        )
    }

    const renderCustomFields = () => {
        if (campaign?.form_type !== 'custom_form') return null

        const fields = Array.isArray(campaign.form_schema)
            ? campaign.form_schema
            : []

        if (fields.length === 0) return null

        return (
            <div className="space-y-4">
                {fields.map((field) => {
                    const value = customAnswers[field.name] || ''

                    if (field.type === 'textarea') {
                        return (
                            <textarea
                                key={field.id}
                                value={value}
                                required={Boolean(field.required)}
                                onChange={(e) =>
                                    setCustomAnswers({
                                        ...customAnswers,
                                        [field.name]: e.target.value,
                                    })
                                }
                                className="min-h-24 w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder={field.placeholder || field.label}
                            />
                        )
                    }

                    if (field.type === 'select') {
                        return (
                            <select
                                key={field.id}
                                value={value}
                                required={Boolean(field.required)}
                                onChange={(e) =>
                                    setCustomAnswers({
                                        ...customAnswers,
                                        [field.name]: e.target.value,
                                    })
                                }
                                className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                            >
                                <option value="">{field.label}</option>
                                {(field.options || []).map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )
                    }

                    if (field.type === 'checkbox') {
                        return (
                            <label
                                key={field.id}
                                className="flex cursor-pointer items-center gap-3 rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold frint-muted"
                            >
                                <input
                                    type="checkbox"
                                    checked={Boolean(customAnswers[field.name])}
                                    onChange={(e) =>
                                        setCustomAnswers({
                                            ...customAnswers,
                                            [field.name]: e.target.checked,
                                        })
                                    }
                                />
                                {field.label}
                            </label>
                        )
                    }

                    return (
                        <input
                            key={field.id}
                            type={
                                field.type === 'phone'
                                    ? 'tel'
                                    : field.type === 'number'
                                        ? 'number'
                                        : field.type === 'date'
                                            ? 'date'
                                            : field.type === 'email'
                                                ? 'email'
                                                : 'text'
                            }
                            value={value}
                            required={Boolean(field.required)}
                            onChange={(e) =>
                                setCustomAnswers({
                                    ...customAnswers,
                                    [field.name]: e.target.value,
                                })
                            }
                            className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                            placeholder={field.placeholder || field.label}
                        />
                    )
                })}
            </div>
        )
    }

    return (
        <div className="frint-page min-h-screen px-4 py-8">
            <main className="mx-auto max-w-xl">
                <section className="frint-card rounded-[32px] p-6">
                    <img
                        src="/logo.svg"
                        alt="Frint"
                        className="h-10 w-auto object-contain"
                    />

                    <h1 className="mt-6 text-3xl font-black text-[var(--frint-text)]">
                        {campaign.title}
                    </h1>

                    {campaign.description && (
                        <p className="mt-3 text-sm font-bold leading-6 frint-muted">
                            {campaign.description}
                        </p>
                    )}

                    {settings?.public_form_notice && (
                        <div className="mt-5 rounded-[22px] bg-[var(--frint-soft-card)] p-4 text-sm font-bold frint-muted">
                            {settings.public_form_notice}
                        </div>
                    )}

                    {message && (
                        <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {message}
                        </div>
                    )}

                    <form onSubmit={submitLead} className="mt-6 space-y-4">
                        <input
                            value={form.student_name}
                            onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                            className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                            placeholder="Full name"
                            required
                        />

                        <input
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                            placeholder="Phone number"
                            required
                        />

                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                            placeholder="Email optional"
                        />

                        <select
                            value={form.college_id}
                            onChange={(e) => setForm({ ...form, college_id: e.target.value })}
                            className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
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
                                className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="Course"
                            />

                            <input
                                value={form.year}
                                onChange={(e) => setForm({ ...form, year: e.target.value })}
                                className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                placeholder="Year"
                            />
                        </div>

                        <input
                            value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                            className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                            placeholder="City"
                        />

                        <input
                            value={form.interest}
                            onChange={(e) => setForm({ ...form, interest: e.target.value })}
                            className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                            placeholder="Interest, example: Internship, Event, Workshop"
                        />

                        {renderExtraFields()}
                        {renderCustomFields()}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="frint-primary-btn flex w-full items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60"
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                            {!submitting && <ArrowRight size={17} />}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    )
}