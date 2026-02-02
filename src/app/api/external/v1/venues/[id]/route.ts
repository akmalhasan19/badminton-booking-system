import { validateApiKey } from '@/lib/api-auth'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // TODO: In the future, fetch from 'venues' table in Supabase.
    // For now, we return the hardcoded configuration for this GOR.

    // Placeholder Data matching the Guide
    const venueData = {
        id: id, // Return requested ID or actual ID
        name: "GOR Smash Juara",
        address: "Jl. Raya Badminton No. 1, Jakarta Selatan",
        maps_url: "https://maps.google.com/?q=GOR+Smash+Juara",
        description: "GOR Badminton standar internasional dengan lantai karpet vinyl berkualitas. Pencahayaan terang dan sirkulasi udara baik.",
        start_hour: "08:00",
        end_hour: "23:00",
        facilities: [
            "Toilet Bersih",
            "Musholla",
            "Parkir Luas (Motor/Mobil)",
            "Kantin",
            "Locker Room",
            "Wifi Gratis"
        ],
        photos: [
            "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop"
        ]
    }

    return NextResponse.json(venueData)
}
