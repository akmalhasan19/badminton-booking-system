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
// ... imports ...

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
        gender: profile?.gender,
        date_of_birth: profile?.date_of_birth,
        city: profile?.city,
    }
}

interface ProfileData {
    full_name: string
    gender?: string
    date_of_birth?: string
    city?: string
    phone?: string
}

export async function updateProfile(data: ProfileData) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('users')
        .update({
            full_name: data.full_name,
            gender: data.gender,
            date_of_birth: data.date_of_birth,
            city: data.city,
            phone: data.phone,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        console.error('Update Profile Error:', error)
        return { error: 'Gagal memperbarui profil' }
    }

    revalidatePath('/profile')
    return { success: true }
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
/**
 * Upload user avatar
 */
import sharp from 'sharp'

// Security: Magic Bytes Constants
const MAGIC_BYTES = {
    jpg: ['ffd8ff'],
    png: ['89504e47'],
    gif: ['47494638'],
    webp: ['52494646', '57454250'], // RIFF ... WEBP (Partial check logic needed often, but specific header usually works)
}

async function validateFileSignature(buffer: Buffer, claimedType: string): Promise<boolean> {
    const hex = buffer.toString('hex', 0, 12).toLowerCase()

    // Normalize claimed type
    const ext = claimedType.toLowerCase().replace('image/', '').replace('jpeg', 'jpg')

    if (ext === 'jpg' && hex.startsWith('ffd8ff')) return true
    if (ext === 'png' && hex.startsWith('89504e47')) return true
    if (ext === 'gif' && hex.startsWith('47494638')) return true
    if (ext === 'webp') {
        // WebP is RIFF....WEBP. 
        // Hex: 52 49 46 46 (4 bytes) ... (4 bytes size) ... 57 45 42 50 (4 bytes id)
        // Check RIFF and WEBP
        return hex.startsWith('52494646') && hex.includes('57454250')
    }

    return false
}

export async function uploadAvatar(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File

    if (!file) {
        return { error: 'No file provided' }
    }

    // 1. Security: Validate Extension (Whitelist)
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''

    if (!allowedExtensions.includes(fileExt)) {
        return { error: 'Invalid file extension. Allowed: .jpg, .jpeg, .png, .gif, .webp' }
    }

    // 2. Security: Validate File Size (Max 2MB)
    const MAX_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_SIZE) {
        return { error: 'File size too large. Max 2MB allowed.' }
    }

    // 3. Security: Validate MIME Type
    if (!file.type.startsWith('image/')) {
        return { error: 'Invalid file type. Only images are allowed.' }
    }

    try {
        const user = await getCurrentUser()
        if (!user) {
            return { error: 'Unauthorized' }
        }

        // 4. Security: Rate Limiting (DoS Protection)
        // Prevent abuse by limiting uploads to once per minute per user
        // We use the 'updated_at' field as a proxy for the last activity
        const { data: userProfile } = await supabase
            .from('users')
            .select('updated_at')
            .eq('id', user.id)
            .single()

        if (userProfile?.updated_at) {
            const lastUpdate = new Date(userProfile.updated_at).getTime()
            const now = Date.now()
            const timeDiff = now - lastUpdate
            const ONE_MINUTE = 60 * 1000

            // If updated less than 1 minute ago
            if (timeDiff < ONE_MINUTE) {
                const remainingSeconds = Math.ceil((ONE_MINUTE - timeDiff) / 1000)
                return { error: `Rate limit exceeded. Please wait ${remainingSeconds} seconds before uploading again.` }
            }
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        // 4. Security: Magic Bytes / File Signature Validation
        const isValidSignature = await validateFileSignature(buffer, file.type)
        if (!isValidSignature) {
            console.error(`Invalid magic bytes for user ${user.id}. Type: ${file.type}`)
            return { error: 'File content does not match its extension. Possible malicious file.' }
        }

        // 5. Security: Image Dimension & Pixel Flood Protection
        // Check metadata before full processing to prevent DoS via decompression bombs or pixel floods
        const metadata = await sharp(buffer).metadata()
        const MAX_DIMENSION = 4096

        if (!metadata.width || !metadata.height) {
            return { error: 'Invalid image file: Unable to determine dimensions.' }
        }

        if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
            return { error: `Image too large. Maximum dimensions allowed are ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.` }
        }

        // 6. Conversion: Convert to WebP using Sharp (Also acts as sanity check)
        const optimizedBuffer = await sharp(buffer)
            .resize({ width: 500, height: 500, fit: 'cover' }) // Resize to reasonable avatar size
            .webp({ quality: 80 })
            .toBuffer()

        // 6. Security: Rename File (Generate random secure filename)
        const fileName = `${crypto.randomUUID()}.webp`
        const filePath = `${user.id}/${fileName}`

        // 7. Upload to Supabase Storage (Stored Outside Web Root by design)
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

        // 8. Cleanup: Remove old files in the user's folder
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

        // 9. Update User Profile
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
        // Generic error to prevent information leakage
        return { error: 'Internal server error during upload' }
    }
}
