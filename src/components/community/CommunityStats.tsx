import { Users, Calendar, Trophy, Star, Bot } from "lucide-react"

interface CommunityStatsProps {
    membersCount: number;
    activeEventsCount?: number;
    rating?: number;
}

export function CommunityStats({ membersCount, activeEventsCount = 24, rating = 4.9 }: CommunityStatsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 mb-8">
            {/* Members Card - Left Column spanning full height of this row */}
            <div className="bg-white border-3 border-black shadow-hard rounded-xl p-5 flex flex-col justify-between relative overflow-hidden h-full min-h-[180px]">
                {/* Divider Line - Horizontal di mobile, Vertical di desktop */}
                <div className="absolute left-0 right-0 top-[22%] -translate-y-1/2 h-[3px] lg:left-[30%] lg:top-0 lg:bottom-0 lg:-translate-x-1/2 lg:translate-y-0 lg:w-[3px] lg:h-auto bg-black"></div>

                <div className="flex justify-between items-start mb-2 relative z-10">
                    <Users className="text-black w-8 h-8" />
                    <span className="bg-black text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest">Members</span>
                </div>

                {/* Layout dengan 2 kolom - Desktop Only */}
                <div className="hidden lg:flex gap-4 items-stretch flex-1 relative z-10">
                    {/* Left Section - Stats */}
                    <div className="flex flex-col justify-between flex-1">
                        <div className="mt-2">
                            <span className="text-6xl font-black block tracking-tighter text-black leading-none">{membersCount}</span>
                            <span className="text-xs font-bold text-green-600 uppercase tracking-tight -ml-1">+12 this week</span>
                        </div>
                        <div className="flex -space-x-3 mt-auto pt-4 pl-1">
                            {/* Decorative Avatars */}
                            <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-200"></div>
                            <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-300"></div>
                            <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-400"></div>
                        </div>
                    </div>

                    {/* Right Section - Placeholder untuk member avatars */}
                    <div className="flex-1">
                        {/* Space reserved for future member avatars */}
                    </div>
                </div>

                {/* Mobile Layout - Custom Positioning */}
                <div className="lg:hidden flex-1 relative z-10">
                    {/* Angka 1 - Kiri Bawah */}
                    <div className="absolute bottom-0 left-0">
                        <span className="text-5xl font-black block tracking-tighter text-black leading-none">{membersCount}</span>
                    </div>

                    {/* +12 this week - Kanan Bawah */}
                    <div className="absolute bottom-0 right-0">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-tight">+12 this week</span>
                    </div>

                    {/* Tiga Lingkaran - Kiri Atas dekat garis */}
                    <div className="absolute top-[10%] left-0 flex -space-x-3">
                        <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-200"></div>
                        <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-300"></div>
                        <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-400"></div>
                    </div>
                </div>
            </div>

            {/* Right Column - Stacked Cards */}
            <div className="flex flex-col gap-3">
                {/* Activities Card */}
                <div className="bg-neo-blue border-3 border-black shadow-hard rounded-xl p-5 text-white relative flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <h3 className="text-sm font-black uppercase tracking-widest">Activities</h3>
                        <Calendar className="w-6 h-6 stroke-[3px]" />
                    </div>
                    <div>
                        <span className="text-5xl font-black tracking-tighter leading-none">{activeEventsCount}</span>
                    </div>
                    <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden mt-2 border border-black/10">
                        <div className="bg-primary h-full w-3/4 border-r-2 border-black"></div>
                    </div>
                </div>

                {/* Rating Card */}
                <div className="bg-primary border-3 border-black shadow-hard rounded-xl p-5 text-black relative flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <h3 className="text-sm font-black uppercase tracking-widest">Rating</h3>
                        <Trophy className="w-6 h-6 stroke-[3px]" />
                    </div>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-5xl font-black tracking-tighter leading-none">{rating}</span>
                        <div className="flex pb-2 gap-0.5">
                            {[...Array(4)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-black text-black" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
