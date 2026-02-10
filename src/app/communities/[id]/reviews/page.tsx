import { getCommunityReviews, getCommunityStats } from "../../actions"
import ReviewsClient from "./ReviewsClient"
import { notFound } from "next/navigation"

export default async function CommunityReviewsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const [reviewsResult, statsResult] = await Promise.all([
        getCommunityReviews(id),
        getCommunityStats(id)
    ])

    if (statsResult.error) {
        // Handle error gracefully or redirect
        console.error("Failed to load stats for community reviews")
    }

    const reviews = reviewsResult.data || []
    const totalCount = reviewsResult.count || 0
    const stats = statsResult.data || {
        overallRating: 0,
        totalReviews: 0,
        categories: [],
        criteria: []
    }

    return (
        <ReviewsClient
            communityId={id}
            initialReviews={reviews}
            stats={stats}
            initialTotalCount={totalCount}
        />
    )
}
