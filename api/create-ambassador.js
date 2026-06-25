import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
        })
    }

    try {
        if (!supabaseUrl || !serviceRoleKey) {
            return res.status(500).json({
                error: 'Server environment is missing Supabase keys.',
            })
        }

        const authHeader = req.headers.authorization || ''
        const accessToken = authHeader.replace('Bearer ', '')

        if (!accessToken) {
            return res.status(401).json({
                error: 'Missing admin session.',
            })
        }

        const {
            data: { user: requester },
            error: requesterError,
        } = await supabaseAdmin.auth.getUser(accessToken)

        if (requesterError || !requester) {
            return res.status(401).json({
                error: 'Invalid admin session.',
            })
        }

        const { data: adminProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, status')
            .eq('id', requester.id)
            .maybeSingle()

        if (profileError) {
            return res.status(500).json({
                error: profileError.message,
            })
        }

        if (adminProfile?.role !== 'admin' || adminProfile?.status !== 'active') {
            return res.status(403).json({
                error: 'Only active admins can create ambassador accounts.',
            })
        }

        const {
            full_name,
            email,
            phone,
            college_id,
            password,
        } = req.body || {}

        if (!full_name?.trim()) {
            return res.status(400).json({
                error: 'Full name is required.',
            })
        }

        if (!email?.trim()) {
            return res.status(400).json({
                error: 'Email is required.',
            })
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                error: 'Temporary password must be at least 6 characters.',
            })
        }

        const createResult = await supabaseAdmin.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password,
            email_confirm: true,
            user_metadata: {
                full_name: full_name.trim(),
                phone: phone?.trim() || null,
            },
            app_metadata: {
                role: 'ambassador',
            },
        })

        if (createResult.error) {
            return res.status(400).json({
                error: createResult.error.message,
            })
        }

        const newUser = createResult.data.user

        const upsertResult = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: newUser.id,
                full_name: full_name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone?.trim() || null,
                role: 'ambassador',
                status: 'active',
                college_id: college_id || null,
            })
            .select('id, full_name, email, phone, role, status, college_id')
            .single()

        if (upsertResult.error) {
            return res.status(500).json({
                error: upsertResult.error.message,
            })
        }

        return res.status(200).json({
            ok: true,
            user: upsertResult.data,
        })
    } catch (error) {
        return res.status(500).json({
            error: error.message || 'Something went wrong.',
        })
    }
}