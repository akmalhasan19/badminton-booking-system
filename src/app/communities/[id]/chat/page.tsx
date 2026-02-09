import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCommunityById } from "../../actions"
import ChatPageClient from "./page-client"

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        notFound()
    }

    // Check if user is community member
    const { data: community } = await getCommunityById(id)
    if (!community) {
        notFound()
    }

    const { data: memberCheck } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .single()

    if (!memberCheck) {
        notFound()
    }

    return (
        <ChatPageClient
            communityId={id}
            communityName={community.name}
            currentUserId={user.id}
            isAdmin={memberCheck.role === "admin"}
        />
    )
}
