import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Refreshes the session automatically
    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Protect admin routes (except /admin/review which uses token-based security)
    if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/review')) {
        if (!session) {
            // No session, redirect to home
            // DEBUG: Commenting out to allow "Access Denied" screen to show for logged out users too
            // return NextResponse.redirect(new URL('/', request.url))
        }

        // Check if user is admin
        // DEPRECATED in Middleware: We now handle detailed authorization in the Admin Layout (layout.tsx)
        // to show a proper "Access Denied" debug screen instead of silently redirecting.
        /*
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (user?.role !== 'admin') {
            // Not an admin, redirect to home
            return NextResponse.redirect(new URL('/', request.url))
        }
        */
    }

    // Protect customer dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!session) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
