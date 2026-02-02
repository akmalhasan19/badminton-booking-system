import { createServiceClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: courts, error } = await supabase
        .from('courts')
        .select('id, name, hourly_rate, is_active')
        .eq('is_active', true)
        .order('court_number', { ascending: true })

    if (error) {
        console.error('Error fetching courts:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json({ data: courts })
}
