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

        const subscription = supabase
            .channel(`public:${table}`)
            .on(
                "postgres_changes" as any,
                {
                    event: event as "*",
                    schema: "public" as const,
                    table,
                    ...(filter && { filter })
                } as any,
                (payload: RealtimePostgresChangesPayload<any>) => {
                    if (payload.eventType === "INSERT" && onInsert) {
                        onInsert(payload.new)
                    } else if (payload.eventType === "UPDATE" && onUpdate) {
                        onUpdate(payload.new)
                    } else if (payload.eventType === "DELETE" && onDelete) {
                        onDelete(payload.old)
                    }
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [table, filter, event, onInsert, onUpdate, onDelete])
}
