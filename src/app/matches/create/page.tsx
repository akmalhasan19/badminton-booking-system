import { getCommunityById } from "@/app/communities/actions"
import CreateMatchPageClient from "./page-client"

interface CreateMatchPageProps {
    searchParams: Promise<{
        communityId?: string
        mode?: string
    }>
}

export default async function CreateMatchPage({ searchParams }: CreateMatchPageProps) {
    const { communityId, mode } = await searchParams
    let communityName = "Community"

    if (communityId) {
        const { data } = await getCommunityById(communityId)
        if (data?.name) {
            communityName = data.name
        }
    }

    return (
        <CreateMatchPageClient
            communityId={communityId || null}
            communityName={communityName}
            mode={(mode || "CASUAL").toUpperCase()}
        />
    )
}
