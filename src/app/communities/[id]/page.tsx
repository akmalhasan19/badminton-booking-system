import { notFound } from "next/navigation"
import { getCommunityById } from "../actions"
import { MobileHeader } from "@/components/MobileHeader"
import {
    Users,
    Calendar,
    Star,
    Share2,
    MoreVertical,
    ArrowLeft,
    MessageCircle,
    Plus,
    Trophy,
    Clock,
    User,
    Home,
    ArrowRight
} from "lucide-react"
import Link from "next/link"

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: community, error } = await getCommunityById(id)

    if (error || !community) {
        notFound()
    }

    return (
        <main className="min-h-screen bg-white dark:bg-dark font-display text-gray-900 dark:text-gray-100 pb-24">
            <div className="max-w-md mx-auto relative bg-white dark:bg-dark min-h-screen shadow-2xl overflow-hidden pb-24">

                {/* Hero Section */}
                <div className="relative h-64 w-full">
                    <img
                        alt="Badminton court"
                        className="w-full h-full object-cover"
                        src={community.cover_url || "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                    {/* Top Navigation */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                        <Link href="/communities" className="bg-white dark:bg-dark w-10 h-10 flex items-center justify-center border-2 border-black dark:border-white shadow-neobrutalism-sm active:translate-y-1 active:shadow-none transition-all rounded-lg">
                            <ArrowLeft className="w-6 h-6 text-black dark:text-white" />
                        </Link>
                        <div className="flex gap-2">
                            <button className="bg-white dark:bg-dark w-10 h-10 flex items-center justify-center border-2 border-black dark:border-white shadow-neobrutalism-sm active:translate-y-1 active:shadow-none transition-all rounded-lg">
                                <Share2 className="w-5 h-5 text-black dark:text-white" />
                            </button>
                            <button className="bg-white dark:bg-dark w-10 h-10 flex items-center justify-center border-2 border-black dark:border-white shadow-neobrutalism-sm active:translate-y-1 active:shadow-none transition-all rounded-lg">
                                <MoreVertical className="w-5 h-5 text-black dark:text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Profile Picture - Rotated */}
                    <div className="absolute -bottom-10 left-4 z-20">
                        <div className="w-24 h-24 rounded-xl border-2 border-black bg-white dark:bg-dark overflow-hidden shadow-neobrutalism rotate-[-3deg]">
                            {community.logo_url ? (
                                <img alt={community.name} className="w-full h-full object-cover" src={community.logo_url} />
                            ) : (
                                <div className="w-full h-full bg-primary flex items-center justify-center text-3xl font-black text-black uppercase">
                                    {community.name.substring(0, 2)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hero Actions */}
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20 items-end">
                        <button className="bg-primary px-4 py-2 text-sm font-bold border-2 border-black shadow-neobrutalism active:translate-y-1 active:shadow-none transition-all text-black uppercase tracking-wider rounded-lg flex items-center gap-1">
                            Follow <Plus className="w-4 h-4 ml-1" />
                        </button>
                        <button className="bg-secondary px-6 py-2 text-sm font-bold text-white border-2 border-black shadow-neobrutalism active:translate-y-1 active:shadow-none transition-all uppercase tracking-wider rounded-lg">
                            Chat
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                <div className="pt-12 px-5 pb-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-black uppercase leading-tight tracking-tighter mb-2">
                            {community.name}
                        </h1>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold px-2 py-1 uppercase tracking-widest transform -skew-x-12 inline-block">
                                {community.city || "Unknown Location"}
                            </span>
                            <span className="bg-white dark:bg-dark border border-black dark:border-white text-black dark:text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest rounded-md">
                                Competitive
                            </span>
                        </div>
                        <div className="flex gap-3 items-start border-l-4 border-secondary pl-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                                {community.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* Members Card */}
                        <div className="bg-white dark:bg-dark border-2 border-black dark:border-white shadow-neobrutalism rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-2">
                                <Users className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                                <span className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold px-1.5 py-0.5 uppercase rounded-sm">Members</span>
                            </div>
                            <div>
                                <span className="text-4xl font-black block">{community.members_count || 0}</span>
                                <span className="text-xs font-bold text-green-600 dark:text-green-400">+12 this week</span>
                            </div>
                            <div className="flex -space-x-2 mt-3">
                                <div className="w-6 h-6 rounded-full border border-black bg-gray-200"></div>
                                <div className="w-6 h-6 rounded-full border border-black bg-gray-300"></div>
                                <div className="w-6 h-6 rounded-full border border-black bg-gray-400"></div>
                            </div>
                        </div>

                        {/* Right Column Stats */}
                        <div className="flex flex-col gap-4">
                            {/* Activities Count */}
                            <div className="bg-accent-blue bg-blue-500 border-2 border-black shadow-neobrutalism rounded-xl p-3 text-white relative">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xs font-bold uppercase opacity-90">Activities</h3>
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="mt-1">
                                    <span className="text-3xl font-black">24</span>
                                </div>
                                <div className="mt-2 w-full bg-black/20 h-2 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full w-3/4 border-r-2 border-black"></div>
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="bg-primary border-2 border-black shadow-neobrutalism rounded-xl p-3 text-black relative flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xs font-bold uppercase opacity-90">Rating</h3>
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div className="flex items-end gap-1 mt-1">
                                    <span className="text-3xl font-black">4.9</span>
                                    <div className="flex pb-1.5 text-black">
                                        <Star className="w-3 h-3 fill-black text-black" />
                                        <Star className="w-3 h-3 fill-black text-black" />
                                        <Star className="w-3 h-3 fill-black text-black" />
                                        <Star className="w-3 h-3 fill-black text-black" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activities Header */}
                    <div className="mb-4 flex items-end justify-between border-b-4 border-black dark:border-white pb-2">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Activities</h2>
                        <button className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1 uppercase rounded-sm hover:bg-gray-800 transition-colors">
                            View All
                        </button>
                    </div>

                    {/* Activity Filter Buttons */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                        <button className="bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white px-4 py-1.5 text-xs font-bold uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-0.5 active:shadow-none transition-all">
                            All Events
                        </button>
                        <button className="bg-white dark:bg-dark text-black dark:text-white border-2 border-black dark:border-white px-4 py-1.5 text-xs font-bold uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-0.5 active:shadow-none transition-all">
                            Open Play
                        </button>
                        <button className="bg-white dark:bg-dark text-black dark:text-white border-2 border-black dark:border-white px-4 py-1.5 text-xs font-bold uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-0.5 active:shadow-none transition-all">
                            Tournaments
                        </button>
                    </div>

                    {/* Activities List */}
                    <div className="flex overflow-x-auto gap-4 no-scrollbar pb-8 -mx-5 px-5">
                        {/* Activity Card 1 */}
                        <div className="min-w-[280px] bg-white dark:bg-dark border-2 border-black dark:border-white shadow-neobrutalism rounded-xl overflow-hidden flex flex-col">
                            <div className="h-32 bg-gray-300 relative">
                                <img alt="Badminton silhouettes" className="w-full h-full object-cover grayscale opacity-60" src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop" />
                                <span className="absolute top-2 right-2 bg-secondary text-white text-[10px] font-bold px-2 py-1 uppercase border border-black shadow-sm">
                                    Today
                                </span>
                            </div>
                            <div className="p-4 flex flex-col gap-2">
                                <h3 className="text-lg font-bold leading-tight">Morning Smash Session</h3>
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    07:00 - 09:00 AM
                                </div>
                                <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 my-1"></div>
                                <div className="flex justify-between items-center mt-1">
                                    <div className="flex -space-x-2 items-center">
                                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-dark bg-gray-200 flex items-center justify-center text-[10px] font-bold">JD</div>
                                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-dark bg-black text-white flex items-center justify-center text-[10px] font-bold">+4</div>
                                    </div>
                                    <button className="w-8 h-8 bg-secondary border-2 border-black flex items-center justify-center rounded-md shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-none transition-all">
                                        <ArrowRight className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Activity Card 2 */}
                        <div className="min-w-[280px] bg-primary border-2 border-black shadow-neobrutalism rounded-xl overflow-hidden flex flex-col">
                            <div className="h-32 bg-yellow-200 relative border-b-2 border-black">
                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                    <Trophy className="w-24 h-24 text-black" />
                                </div>
                                <span className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase border border-white shadow-sm">
                                    Weekend
                                </span>
                            </div>
                            <div className="p-4 flex flex-col gap-2">
                                <h3 className="text-lg font-bold leading-tight text-black">Weekly Tournament</h3>
                                <div className="flex items-center gap-2 text-sm font-semibold text-black/80">
                                    <Clock className="w-4 h-4" />
                                    Sat, 14:00 PM
                                </div>
                                <div className="border-t-2 border-dashed border-black/20 my-1"></div>
                                <div className="flex justify-between items-center mt-1">
                                    <div className="flex -space-x-2 items-center">
                                        <div className="w-8 h-8 rounded-full border-2 border-primary bg-white flex items-center justify-center text-[10px] font-bold text-black">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className="w-8 h-8 rounded-full border-2 border-primary bg-black text-white flex items-center justify-center text-[10px] font-bold">+12</div>
                                    </div>
                                    <button className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center rounded-md shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 active:shadow-none transition-all">
                                        <ArrowRight className="w-5 h-5 text-black" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Challenge Mode Card */}
                    <div className="mt-2 bg-black dark:bg-zinc-800 border-2 border-black dark:border-white shadow-neobrutalism rounded-xl p-6 relative overflow-visible">
                        <div className="absolute -top-3 -right-2 bg-primary border-2 border-black px-3 py-1 transform rotate-6 shadow-sm z-10">
                            <span className="text-xs font-black uppercase">New</span>
                        </div>
                        <h3 className="text-white text-xl font-bold mb-2">Challenge Mode?</h3>
                        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                            Open your community for sparring with other clubs nearby. Prove your worth on the court.
                        </p>
                        <button className="w-full bg-white text-black font-black uppercase py-3 border-2 border-black shadow-[4px_4px_0px_0px_#EF4444] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#EF4444] transition-all rounded-lg">
                            Activate Now
                        </button>
                    </div>
                </div>



            </div>
        </main>
    )
}
