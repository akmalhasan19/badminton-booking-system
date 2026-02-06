'use server'

import { updateSetting } from "@/lib/api/settings"
import { revalidatePath } from "next/cache"

export async function updateFeeSettings(formData: FormData) {
    const applicationFee = formData.get('application_fee') as string
    const xenditFee = formData.get('xendit_fee') as string

    if (!applicationFee || !xenditFee) {
        return { error: 'Please provide all values' }
    }

    try {
        await updateSetting('application_fee', applicationFee)
        await updateSetting('xendit_fee', xenditFee)

        revalidatePath('/admin/settings')
        return { success: true }
    } catch (error) {
        console.error('Failed to update settings:', error)
        return { error: 'Failed to update settings' }
    }
}
