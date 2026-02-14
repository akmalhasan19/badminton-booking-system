import 'server-only'

import { createClient } from '@/lib/supabase/server'

type DebugAccessCheck =
    | { allowed: true }
    | { allowed: false; status: 403 | 404; error: string }

function isDebugFeatureEnabled() {
    const configuredValue = process.env.DEBUG_ACCESS_ENABLED
    if (configuredValue === 'true') return true
    if (configuredValue === 'false') return false

    return process.env.NODE_ENV !== 'production'
}

export async function checkDebugAccess(): Promise<DebugAccessCheck> {
    if (process.env.NODE_ENV === 'production') {
        return { allowed: false, status: 404, error: 'Not found' }
    }

    if (!isDebugFeatureEnabled()) {
        return { allowed: false, status: 403, error: 'Debug access is disabled' }
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { allowed: false, status: 403, error: 'Forbidden' }
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim()
    if (adminEmail && user.email === adminEmail) {
        return { allowed: true }
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { allowed: false, status: 403, error: 'Forbidden' }
    }

    return { allowed: true }
}
