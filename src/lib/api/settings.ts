import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath, unstable_cache } from 'next/cache'

export type Setting = {
    key: string
    value: string
    description: string
    updated_at: string
}

/**
 * Get all settings (Cached)
 */
export const getSettings = unstable_cache(
    async (): Promise<Record<string, string>> => {
        const supabase = createServiceClient()
        const { data, error } = await supabase.from('settings').select('*')

        if (error) {
            console.error('Error fetching settings:', error)
            return {}
        }

        const settingsMap: Record<string, string> = {}
        data.forEach(setting => {
            settingsMap[setting.key] = setting.value
        })

        return settingsMap
    },
    ['settings'],
    { tags: ['settings'] }
)

/**
 * Get a specific setting with fallback (Cached)
 */
export async function getSetting<T = string>(key: string, defaultValue: T): Promise<T> {
    const settings = await getSettings()
    const value = settings[key]

    if (value === undefined) {
        return defaultValue
    }

    // Attempt type conversion
    if (typeof defaultValue === 'number') {
        const num = Number(value)
        return (isNaN(num) ? defaultValue : num) as T
    }

    if (typeof defaultValue === 'boolean') {
        return (value === 'true') as T
    }

    return value as T
}

/**
 * Update a setting (Server Action)
 */
export async function updateSetting(key: string, value: string) {
    const supabase = createServiceClient()

    // Check permission (Admin only) - implicitly handled by RLS, but explicit check good too
    // For now assuming caller handles auth or RLS handles it.

    const { error } = await supabase
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() })

    if (error) {
        throw new Error(`Failed to update setting ${key}: ${error.message}`)
    }

    // Revalidate admin settings page and any other pages using settings
    revalidatePath('/admin/settings', 'page')
    revalidatePath('/', 'layout') // Revalidate entire app to ensure settings changes propagate
    return { success: true }
}
