'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { getSetting, updateSetting } from '@/lib/api/settings'
import { revalidatePath } from 'next/cache'

/**
 * Get the current challenge mode status
 * Public read access
 */
export async function getChallengeModeStatus(): Promise<{ enabled: boolean }> {
    const enabled = await getSetting('challenge_mode_enabled', false)
    return { enabled }
}

/**
 * Toggle challenge mode on/off
 * Admin-only action
 */
export async function toggleChallengeMode(): Promise<{
    success: boolean
    enabled?: boolean
    error?: string
}> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized: Please login' }
    }

    // Check if user is admin
    const supabase = await createClient()
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') {
        return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Get current status
    const { enabled } = await getChallengeModeStatus()

    // Toggle it
    const newValue = !enabled
    const result = await updateSetting('challenge_mode_enabled', String(newValue))

    if (!result.success) {
        return { success: false, error: 'Failed to update challenge mode setting' }
    }

    // Revalidate pages that might display challenge mode
    revalidatePath('/')
    revalidatePath('/challenges')

    return { success: true, enabled: newValue }
}

/**
 * Set challenge mode to a specific value
 * Admin-only action  
 */
export async function setChallengeModeStatus(enabled: boolean): Promise<{
    success: boolean
    error?: string
}> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized: Please login' }
    }

    // Check if user is admin
    const supabase = await createClient()
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') {
        return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const result = await updateSetting('challenge_mode_enabled', String(enabled))

    if (!result.success) {
        return { success: false, error: 'Failed to update challenge mode setting' }
    }

    revalidatePath('/')
    revalidatePath('/challenges')

    return { success: true }
}
