import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface UseRealtimeSubscriptionProps {
    table: string
    filter?: string
    event?: "INSERT" | "UPDATE" | "DELETE" | "*"
    onInsert?: (data: any) => void
    onUpdate?: (data: any) => void
    onDelete?: (data: any) => void
}

export default function useRealtimeSubscription({
    table,
    filter,
    event = "*",
    onInsert,
    onUpdate,
    onDelete
}: UseRealtimeSubscriptionProps) {
    useEffect(() => {
        const supabase = createClient()

        console.log('🔴 Setting up Realtime subscription:', { table, filter, event })

        const channelName = `public:${table}${filter ? `:${filter}` : ''}`

        let subscription = supabase.channel(channelName)

        if (event === "*") {
            subscription = subscription
                .on(
                    "postgres_changes" as any,
                    { event: "INSERT", schema: "public", table, ...(filter && { filter }) },
                    (payload) => {
                        console.log('🟢 Realtime INSERT received:', payload)
                        if (onInsert) onInsert(payload.new)
                    }
                )
                .on(
                    "postgres_changes" as any,
                    { event: "UPDATE", schema: "public", table, ...(filter && { filter }) },
                    (payload) => {
                        console.log('🟢 Realtime UPDATE received:', payload)
                        if (onUpdate) onUpdate(payload.new)
                    }
                )
                .on(
                    "postgres_changes" as any,
                    { event: "DELETE", schema: "public", table, ...(filter && { filter }) },
                    (payload) => {
                        console.log('🟢 Realtime DELETE received:', payload)
                        if (onDelete) onDelete(payload.old)
                    }
                )
        } else {
            subscription = subscription.on(
                "postgres_changes" as any,
                {
                    event: event as any,
                    schema: "public" as const,
                    table,
                    ...(filter && { filter })
                } as any,
                (payload: RealtimePostgresChangesPayload<any>) => {
                    console.log(`🟢 Realtime ${event} received:`, payload)

                    if (payload.eventType === "INSERT" && onInsert) {
                        onInsert(payload.new)
                    } else if (payload.eventType === "UPDATE" && onUpdate) {
                        onUpdate(payload.new)
                    } else if (payload.eventType === "DELETE" && onDelete) {
                        onDelete(payload.old)
                    }
                }
            )
        }

        subscription.subscribe((status, err) => {
            console.log('🔵 Realtime subscription status:', status, err)
        })

        console.log('🟡 Realtime subscription created for channel:', channelName)

        return () => {
            console.log('🔴 Unsubscribing from Realtime channel:', channelName)
            subscription.unsubscribe()
        }
    }, [table, filter, event, onInsert, onUpdate, onDelete])
}
