import { notFound } from 'next/navigation'

import { checkDebugAccess } from '@/lib/security/debug-access'

export default async function DebugLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const access = await checkDebugAccess()

    if (!access.allowed) {
        notFound()
    }

    return <>{children}</>
}
