'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface SignUpData {
    email: string
    password: string
    fullName: string
    phone?: string
}

interface SignInData {
    email: string
    password: string
}

/**
 * Register a new user
 */
export async function signUp(data: SignUpData) {
    const supabase = await createClient()

    const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                full_name: data.fullName,
                phone: data.phone,
                role: 'customer',
            },
        },
    })

    if (error) {
        console.log('Supabase SignUp Error:', error) // Debug logging
        return { error: error.message || JSON.stringify(error) }
    }

    revalidatePath('/', 'layout')
    return { success: true, isSessionCreated: !!signUpData.session }
}

/**
 * Sign in with email and password
 */
export async function signIn(data: SignInData) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

/**
 * Sign out current user
 */
export async function signOut() {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

/**
 * Get current authenticated user with profile data
 */
export async function getCurrentUser() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Get user profile from public.users table
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    return {
        id: user.id,
        email: user.email!,
        name: profile?.full_name || user.user_metadata?.full_name || 'User',
        role: profile?.role || 'customer',
        phone: profile?.phone,
        avatar_url: profile?.avatar_url,
    }
}

/**
 * Check if current user is admin
 */
export async function isAdmin() {
    const user = await getCurrentUser()
    return user?.role === 'admin'
}

/**
 * Get OAuth URL for Google sign in
 * Note: This needs to be called from a client component
 */
export async function getGoogleAuthUrl() {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    return { url: data.url }
}

/**
 * Upload user avatar
 */
import sharp from 'sharp'

export async function uploadAvatar(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File

    if (!file) {
        return { error: 'No file provided' }
    }

    // 1. Security: Validate File Size (Max 2MB)
    const MAX_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_SIZE) {
        return { error: 'File size too large. Max 2MB allowed.' }
    }

    // 2. Security: Validate MIME Type
    if (!file.type.startsWith('image/')) {
        return { error: 'Invalid file type. Only images are allowed.' }
    }

    try {
        const user = await getCurrentUser()
        if (!user) {
            return { error: 'Unauthorized' }
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        // 3. Conversion: Convert to WebP using Sharp
        const optimizedBuffer = await sharp(buffer)
            .resize({ width: 500, height: 500, fit: 'cover' }) // Resize to reasonable avatar size
            .webp({ quality: 80 })
            .toBuffer()

        // Generate a random "secure" filename
        const fileName = `${crypto.randomUUID()}.webp`
        const filePath = `${user.id}/${fileName}`

        // 4. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('user-profile-picture')
            .upload(filePath, optimizedBuffer, {
                contentType: 'image/webp',
                upsert: true
            })

        if (uploadError) {
            console.error('Supabase Storage Error:', uploadError)
            return { error: `Failed to upload image: ${uploadError.message}` }
        }

        // 5. Cleanup: Remove old files in the user's folder
        const { data: listData } = await supabase.storage
            .from('user-profile-picture')
            .list(user.id)

        if (listData && listData.length > 0) {
            const filesToRemove = listData
                .filter(f => f.name !== fileName)
                .map(f => `${user.id}/${f.name}`)

            if (filesToRemove.length > 0) {
                await supabase.storage
                    .from('user-profile-picture')
                    .remove(filesToRemove)
            }
        }

        // 6. Update User Profile
        // Add timestamp to force cache busting (though filename change handles this mostly, sometimes convenient)
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-profile-picture/${filePath}`

        const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id)

        if (updateError) {
            console.error('Supabase DB Error:', updateError)
            return { error: 'Failed to update profile' }
        }

        revalidatePath('/profile')
        return { success: true, avatarUrl: publicUrl }

    } catch (error) {
        console.error('Avatar Upload Error:', error)
        return { error: 'Internal server error during upload' }
    }
}
