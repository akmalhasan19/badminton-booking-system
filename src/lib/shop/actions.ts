'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

// ============== TYPES ==============

export interface Product {
    id: string
    name: string
    description: string | null
    category: 'Racket' | 'Shoes' | 'Apparel' | 'Accessory'
    price: number
    image_url: string | null
    is_active: boolean
    is_new: boolean
    stock_quantity: number
    created_at: string
    updated_at: string
}

export interface ProductFilters {
    category?: string
    search?: string
    isActive?: boolean
    isNew?: boolean
}

export interface NewsletterSubscriber {
    id: string
    email: string
    subscribed_at: string
    is_active: boolean
    source: string | null
    created_at: string
}

// ============== PRODUCT ACTIONS ==============

/**
 * Get products with optional filters
 * Public can only see active products, admins can see all
 */
export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
    const supabase = await createClient()
    const user = await getCurrentUser()

    // Check if user is admin
    let isAdmin = false
    if (user) {
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
        isAdmin = userData?.role === 'admin'
    }

    let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

    // Non-admins can only see active products
    if (!isAdmin) {
        query = query.eq('is_active', true)
    }

    // Apply filters
    if (filters?.category) {
        query = query.eq('category', filters.category)
    }

    if (filters?.search) {
        const searchTerm = `%${filters.search}%`
        query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
    }

    if (filters?.isActive !== undefined && isAdmin) {
        query = query.eq('is_active', filters.isActive)
    }

    if (filters?.isNew !== undefined) {
        query = query.eq('is_new', filters.isNew)
    }

    const { data, error } = await query

    if (error) {
        console.error('Failed to fetch products:', error)
        return []
    }

    return data || []
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
    const supabase = await createClient()
    const user = await getCurrentUser()

    // Check if user is admin
    let isAdmin = false
    if (user) {
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
        isAdmin = userData?.role === 'admin'
    }

    let query = supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

    const { data, error } = await query

    if (error) {
        console.error('Failed to fetch product:', error)
        return null
    }

    // Non-admins can only see active products
    if (!isAdmin && data && !data.is_active) {
        return null
    }

    return data
}

/**
 * Create a new product (Admin only)
 */
export async function createProduct(productData: {
    name: string
    description?: string
    category: string
    price: number
    image_url?: string
    is_new?: boolean
    stock_quantity?: number
}): Promise<{ success: boolean; data?: Product; error?: string }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized: Please login' }
    }

    const supabase = createServiceClient()

    // Check if user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') {
        return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Validate category
    const validCategories = ['Racket', 'Shoes', 'Apparel', 'Accessory']
    if (!validCategories.includes(productData.category)) {
        return { success: false, error: 'Invalid category' }
    }

    const { data, error } = await supabase
        .from('products')
        .insert({
            name: productData.name,
            description: productData.description || null,
            category: productData.category,
            price: productData.price,
            image_url: productData.image_url || null,
            is_new: productData.is_new || false,
            stock_quantity: productData.stock_quantity || 0,
            is_active: true,
        })
        .select()
        .single()

    if (error) {
        console.error('Failed to create product:', error)
        return { success: false, error: 'Failed to create product' }
    }

    revalidatePath('/shop')
    return { success: true, data }
}

/**
 * Update a product (Admin only)
 */
export async function updateProduct(
    id: string,
    updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized: Please login' }
    }

    const supabase = createServiceClient()

    // Check if user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') {
        return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)

    if (error) {
        console.error('Failed to update product:', error)
        return { success: false, error: 'Failed to update product' }
    }

    revalidatePath('/shop')
    return { success: true }
}

/**
 * Delete a product (soft delete by setting is_active to false)
 * Admin only
 */
export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    const user = await getCurrentUser()

    if (!user) {
        return { success: false, error: 'Unauthorized: Please login' }
    }

    const supabase = createServiceClient()

    // Check if user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') {
        return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Soft delete
    const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)

    if (error) {
        console.error('Failed to delete product:', error)
        return { success: false, error: 'Failed to delete product' }
    }

    revalidatePath('/shop')
    return { success: true }
}

// ============== NEWSLETTER ACTIONS ==============

/**
 * Subscribe to newsletter
 * No authentication required
 */
export async function subscribeNewsletter(
    email: string,
    source: string = 'shop_page'
): Promise<{ success: boolean; message: string }> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { success: false, message: 'Please enter a valid email address' }
    }

    const supabase = createServiceClient()

    // Check if email already exists
    const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id, is_active')
        .eq('email', email.toLowerCase())
        .single()

    if (existing) {
        if (existing.is_active) {
            return {
                success: true,
                message: 'You\'re already subscribed! Check your inbox for updates.',
            }
        } else {
            // Reactivate subscription
            const { error } = await supabase
                .from('newsletter_subscribers')
                .update({ is_active: true, subscribed_at: new Date().toISOString() })
                .eq('email', email.toLowerCase())

            if (error) {
                console.error('Failed to reactivate subscription:', error)
                return { success: false, message: 'Something went wrong. Please try again.' }
            }

            return { success: true, message: 'Welcome back! Your subscription has been reactivated.' }
        }
    }

    // Insert new subscriber
    const { error } = await supabase.from('newsletter_subscribers').insert({
        email: email.toLowerCase(),
        source,
    })

    if (error) {
        console.error('Failed to subscribe to newsletter:', error)
        return { success: false, message: 'Something went wrong. Please try again.' }
    }

    return {
        success: true,
        message: 'Thanks for subscribing! Check your inbox for exclusive deals.',
    }
}

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeNewsletter(email: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createServiceClient()

    const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active: false })
        .eq('email', email.toLowerCase())

    if (error) {
        console.error('Failed to unsubscribe from newsletter:', error)
        return { success: false, error: 'Failed to unsubscribe' }
    }

    return { success: true }
}

/**
 * Get all newsletter subscribers (Admin only)
 */
export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    const user = await getCurrentUser()

    if (!user) {
        return []
    }

    const supabase = await createClient()

    // Check if user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') {
        return []
    }

    const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch newsletter subscribers:', error)
        return []
    }

    return data || []
}
