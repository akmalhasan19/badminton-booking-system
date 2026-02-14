"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ReportTargetType = 'community' | 'message' | 'review' | 'user'
export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export type Report = {
    id: string
    reporter_user_id: string
    target_type: ReportTargetType
    target_id: string
    reason: string
    description: string | null
    status: ReportStatus
    created_at: string
    reporter?: {
        id: string
        full_name: string
        email: string
    }
}

export type ReportAction = {
    id: string
    report_id: string
    admin_user_id: string
    action: string
    notes: string | null
    created_at: string
}

async function getAdminContext() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { supabase, user: null, error: 'Not authenticated' as const }
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim()
    if (adminEmail && user.email === adminEmail) {
        return { supabase, user, error: null }
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { supabase, user: null, error: 'Forbidden' as const }
    }

    return { supabase, user, error: null }
}

/**
 * Submit a report for moderation
 */
export async function submitReport(data: {
    targetType: ReportTargetType
    targetId: string
    reason: string
    description?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "You must be logged in to submit a report." }
    }

    const { targetType, targetId, reason, description } = data

    if (!targetType || !targetId || !reason) {
        return { error: "Missing required fields." }
    }

    try {
        const { data: report, error: insertError } = await supabase
            .from('reports')
            .insert({
                reporter_user_id: user.id,
                target_type: targetType,
                target_id: targetId,
                reason,
                description: description || null,
                status: 'pending'
            })
            .select()
            .single()

        if (insertError) throw insertError

        return { success: true, data: report }
    } catch (error) {
        console.error("Error submitting report:", error)
        return { error: "Failed to submit report." }
    }
}

/**
 * Get all reports (admin only)
 */
export async function getReports(filter?: { status?: ReportStatus; targetType?: ReportTargetType }) {
    const { supabase, error: adminError } = await getAdminContext()
    if (adminError) {
        return { error: adminError, data: [] }
    }

    try {
        let query = supabase
            .from('reports')
            .select(`
                id,
                reporter_user_id,
                target_type,
                target_id,
                reason,
                description,
                status,
                created_at,
                reporter:users!reports_reporter_user_id_fkey (
                    id,
                    full_name,
                    email
                )
            `)
            .order('created_at', { ascending: false })

        if (filter?.status) {
            query = query.eq('status', filter.status)
        }

        if (filter?.targetType) {
            query = query.eq('target_type', filter.targetType)
        }

        const { data, error } = await query

        if (error) throw error

        const reports = (data || []).map((report: any) => ({
            id: report.id,
            reporter_user_id: report.reporter_user_id,
            target_type: report.target_type,
            target_id: report.target_id,
            reason: report.reason,
            description: report.description,
            status: report.status,
            created_at: report.created_at,
            reporter: report.reporter ? {
                id: report.reporter.id,
                full_name: report.reporter.full_name || 'Unknown',
                email: report.reporter.email || ''
            } : undefined
        })) as Report[]

        return { data: reports }
    } catch (error) {
        console.error("Error fetching reports:", error)
        return { error: "Failed to fetch reports.", data: [] }
    }
}

/**
 * Resolve a report (admin only)
 */
export async function resolveReport(reportId: string, action: string, notes?: string) {
    const { supabase, user, error: adminError } = await getAdminContext()
    if (adminError || !user) {
        return { error: adminError || 'Not authenticated' }
    }

    try {
        // Update report status
        const newStatus = action === 'dismiss' ? 'dismissed' : 'resolved'

        const { error: updateError } = await supabase
            .from('reports')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', reportId)

        if (updateError) throw updateError

        // Log the action
        const { error: actionError } = await supabase
            .from('report_actions')
            .insert({
                report_id: reportId,
                admin_user_id: user.id,
                action,
                notes: notes || null
            })

        if (actionError) throw actionError

        revalidatePath('/admin/reports')
        return { success: true }
    } catch (error) {
        console.error("Error resolving report:", error)
        return { error: "Failed to resolve report." }
    }
}

/**
 * Get report actions/history for a specific report
 */
export async function getReportActions(reportId: string) {
    const { supabase, error: adminError } = await getAdminContext()
    if (adminError) {
        return { error: adminError, data: [] }
    }

    try {
        const { data, error } = await supabase
            .from('report_actions')
            .select(`
                id,
                report_id,
                admin_user_id,
                action,
                notes,
                created_at,
                admin:users!report_actions_admin_user_id_fkey (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('report_id', reportId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { data: data || [] }
    } catch (error) {
        console.error("Error fetching report actions:", error)
        return { error: "Failed to fetch report actions.", data: [] }
    }
}
