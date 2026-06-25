import { supabase } from './supabase'

export async function createAmbassadorAccount(payload) {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
        throw new Error('Admin session not found.')
    }

    const response = await fetch('/api/create-ambassador', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Failed to create ambassador.')
    }

    return data
}