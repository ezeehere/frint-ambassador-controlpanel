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
                error: 'Only active admins can update ambassador accounts.',
            })
        }

        const {
            ambassador_id,
            action,
            password,
        } = req.body || {}

        if (!ambassador_id) {
            return res.status(400).json({
                error: 'Ambassador id is required.',
            })
        }

        const { data: targetProfile, error: targetError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, email, full_name, status')
            .eq('id', ambassador_id)
            .maybeSingle()

        if (targetError) {
            return res.status(500).json({
                error: targetError.message,
            })
        }

        if (!targetProfile || targetProfile.role !== 'ambassador') {
            return res.status(404).json({
                error: 'Ambassador account not found.',
            })
        }

        if (action === 'reset_password') {
            if (!password || password.length < 6) {
                return res.status(400).json({
                    error: 'New password must be at least 6 characters.',
                })
            }

            const updateResult = await supabaseAdmin.auth.admin.updateUserById(
                ambassador_id,
                {
                    password,
                }
            )

            if (updateResult.error) {
                return res.status(400).json({
                    error: updateResult.error.message,
                })
            }

            return res.status(200).json({
                ok: true,
                message: 'Password reset successfully.',
            })
        }

        if (action === 'suspend' || action === 'activate') {
            const newStatus = action === 'suspend' ? 'suspended' : 'active'

            const updateProfile = await supabaseAdmin
                .from('profiles')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', ambassador_id)
                .select('id, full_name, email, role, status')
                .single()

            if (updateProfile.error) {
                return res.status(500).json({
                    error: updateProfile.error.message,
                })
            }

            return res.status(200).json({
                ok: true,
                user: updateProfile.data,
            })
        }

        return res.status(400).json({
            error: 'Invalid action.',
        })
    } catch (error) {
        return res.status(500).json({
            error: error.message || 'Something went wrong.',
        })
    }
}