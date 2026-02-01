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
