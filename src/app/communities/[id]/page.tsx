import { notFound } from "next/navigation"
import { getCommunityById, getCommunityActivities } from "../actions"
import { CommunityHero } from "@/components/community/CommunityHero"
import { CommunityStats } from "@/components/community/CommunityStats"
import { CommunityActivities } from "@/components/community/CommunityActivities"
import { Search, MapPin, ChevronDown, Home, Calendar, Plus, MessageCircle, User } from "lucide-react"

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: community, error } = await getCommunityById(id)
    const { data: activities } = await getCommunityActivities(id)

    if (error || !community) {
        notFound()
    }

    return (
        <main className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-light dark:text-text-dark selection:bg-primary selection:text-black">
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar would go here - keeping it simple for now or assuming layout wrapper */}

                <div className="flex-1 overflow-y-auto bg-white dark:bg-background-dark relative">
                    {/* Grid Background */}
                    <div
                        className="fixed inset-0 z-0 w-full h-full pointer-events-none block"
                        style={{
                            backgroundImage: 'linear-gradient(to right, rgba(160, 82, 45, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 82, 45, 0.15) 1px, transparent 1px)',
                            backgroundSize: '100px 100px'
                        }}
                    />


                    <div className="p-0 md:p-6 lg:p-10 max-w-[1600px] mx-auto md:space-y-8 pb-8 relative z-10">
                        {/* Desktop Header - Hidding on mobile as per design implies a full cover image start */}


                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-8">
                            {/* Main User/Community Hero */}
                            <div className="lg:col-span-8 h-full">
                                <CommunityHero community={community} isEditable={community.role === 'admin'} />
                            </div>

                            {/* Sidebar Stats */}
                            <div className="lg:col-span-4 h-full px-4 md:px-0">
                                <CommunityStats
                                    membersCount={community.members_count || 0}
                                    community_id={id}
                                />
                            </div>
                        </div>

                        {/* Activities Section */}
                        <div className="px-4 md:px-0">
                            <CommunityActivities
                                activities={activities || []}
                                role={community.role}
                                communityId={id}
                            />
                        </div>
                    </div>

                    {/* Fixed Bottom Navigation - Mobile Only */}

                </div>
            </div>
        </main>
    )
}
