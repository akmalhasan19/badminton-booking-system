"use client"

import { ArrowLeft, Star, Edit, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function CommunityReviewsPage({ params }: { params: { id: string } }) {
    const router = useRouter()

    // Dummy data - will be replaced with actual data from database
    const reviewsData = {
        overallRating: 4.9,
        totalReviews: 124,
        categories: [
            { name: "Main Bareng", rating: 4.8, count: 110, isActive: true },
            { name: "Sparring", rating: 5.0, count: 14, isActive: false }
        ],
        criteria: [
            { name: "Ketepatan Waktu", rating: 4.9, percentage: 98, color: "bg-neo-blue" },
            { name: "Sportifitas", rating: 4.7, percentage: 94, color: "bg-secondary" },
            { name: "Komunikasi", rating: 5.0, percentage: 100, color: "bg-green-500" },
            { name: "Pembagian Waktu", rating: 4.8, percentage: 96, color: "bg-primary" }
        ],
        reviews: [
            {
                id: 1,
                userName: "Dimas Anggara",
                avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFVqfnxomM2tPFmf9pCP0OYm9te2Mq0n9x-QobH25RJ1B41pgiED_V31CUotcl7P3NPyQ3dR6sc--rafX8fHSg3U-3AbgPcOsKqegJsazV7hB7IJHGyKr6e4Wrs_FoIx_ojnwOB37ORspgaz0gSQEM6KXY73E6rc4i45P2quQENPqUtn37uCCxll_X-6t_sSuglTx4tX9bxyT2wpidnFKNBEPfWxKf_C0mMi3NDryb2fywMuI7u_qqE9U0ll_3ZMLCHrSrNgWrHA",
                timeAgo: "2 hari yang lalu",
                rating: 5.0,
                comment: "Seru banget main bareng di sini! Komunitasnya solid, skillnya rata-rata bagus buat sparring. Lapangan juga oke punya.",
                tags: ["#MainBareng", "#Kompetitif"],
                bgColor: "bg-secondary dark:bg-yellow-900/50"
            },
            {
                id: 2,
                userName: "Sarah Wijaya",
                avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6LAESRfgH9QA54ILn4fhpbY-tbnHZ3zb0hf3aGyruOKVCc3Bo9LtYz8KUMjsRmw8ygznvkvc--I96ZMsPcRCtZ7vlaOT8WoJbAIW53u_1bLN_5zrXKVHaDSvwW-P4IaipiCo1D61s_UDeJQYmm5xDRkZg1B3-EVvHPxNBg-K2Dape9zrUmJ2_d5eZce9g3HbAjZ5e52Flayc60G5fy-XxBT1NSNqzP4X4bQLsyEfsn5LZ8ALAHUTja73jxwbO1GwUiSsOhqJe0g",
                timeAgo: "1 minggu yang lalu",
                rating: 4.8,
                comment: "Admin fast response banget kalo di chat. Suka sama sistem pembagian waktunya yang adil, ga ada yang dominasi lapangan sendiri.",
                tags: ["#Komunikasi"],
                bgColor: "bg-neo-blue dark:bg-blue-900/50"
            },
            {
                id: 3,
                userName: "Rudi \"Smash\" Budi",
                avatar: null,
                initials: "RB",
                timeAgo: "2 minggu yang lalu",
                rating: 4.5,
                comment: "Overall oke sih. Cuma kemarin pas dateng sempet nunggu bentar karena yang sebelumnya overtime dikit. Tapi its okay.",
                tags: ["#Sparring"],
                bgColor: "bg-white dark:bg-gray-800"
            }
        ]
    }

    return (
        <main className="min-h-screen bg-background-light dark:bg-background-dark font-display text-text-light dark:text-text-dark transition-colors duration-200">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-primary dark:bg-red-900 border-b-3 border-black dark:border-gray-700 px-4 py-4 flex items-center shadow-neo dark:shadow-none">
                <button
                    onClick={() => router.back()}
                    className="p-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 rounded-lg shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all mr-4"
                >
                    <ArrowLeft className="text-black dark:text-white w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-black dark:text-white tracking-wide">Ulasan Komunitas</h1>
            </header>

            <div className="p-4 max-w-md mx-auto pb-20">
                {/* Rating Summary Card */}
                <div className="bg-white dark:bg-gray-800 border-3 border-black dark:border-gray-600 rounded-xl p-5 shadow-neo mb-6 relative overflow-hidden">
                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-secondary dark:bg-yellow-600 rounded-bl-full border-l-3 border-b-3 border-black dark:border-gray-600 -mr-[3px] -mt-[3px]"></div>

                    {/* Overall Rating */}
                    <div className="flex items-end gap-8 mb-4">
                        {/* Left side - Rating number */}
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-black dark:text-white">{reviewsData.overallRating}</span>
                            <span className="text-gray-500 dark:text-gray-400 font-bold text-lg">/5</span>
                        </div>

                        {/* Right side - Stars and review count */}
                        <div className="flex flex-col justify-center">
                            <div className="flex text-secondary dark:text-yellow-500 mb-1">
                                {[...Array(4)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-current" />
                                ))}
                                <Star className="w-5 h-5 fill-current opacity-50" />
                            </div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Based on {reviewsData.totalReviews} reviews
                            </p>
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex gap-3 mb-6">
                        {reviewsData.categories.map((category, index) => (
                            <button
                                key={index}
                                className={`flex-1 ${category.isActive
                                    ? "bg-primary text-white"
                                    : "bg-white dark:bg-gray-700 text-black dark:text-white group hover:bg-gray-50 dark:hover:bg-gray-600"
                                    } border-2 border-black dark:border-gray-${category.isActive ? '900' : '500'} rounded-lg py-2 px-3 shadow-neo-sm active:translate-y-[2px] active:shadow-none transition-all flex flex-col items-center justify-center`}
                            >
                                <span className={`text-xs font-bold uppercase tracking-wider ${category.isActive ? "opacity-90" : "text-gray-500 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white"
                                    }`}>
                                    {category.name}
                                </span>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="font-black text-lg">{category.rating}</span>
                                    <span className={`text-[10px] ${category.isActive ? "bg-black/20" : "bg-gray-200 dark:bg-gray-500"
                                        } px-1 rounded`}>
                                        {category.count}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Criteria Breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                        {reviewsData.criteria.map((criterion, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold dark:text-gray-200">{criterion.name}</span>
                                    <span className={`text-xs font-black ${criterion.color === 'bg-neo-blue' ? 'text-neo-blue dark:text-blue-400' :
                                            criterion.color === 'bg-secondary' ? 'text-secondary dark:text-yellow-400' :
                                                criterion.color === 'bg-green-500' ? 'text-green-500 dark:text-green-400' :
                                                    'text-primary dark:text-red-400'
                                        }`}>
                                        {criterion.rating}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 border-2 border-black dark:border-gray-600 overflow-hidden">
                                    <div className={`${criterion.color} h-full rounded-full`} style={{ width: `${criterion.percentage}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                    <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full border-2 border-black dark:border-gray-400 text-sm font-bold shadow-neo-sm whitespace-nowrap">
                        Semua
                    </button>
                    <button className="bg-white dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded-full border-2 border-black dark:border-gray-600 text-sm font-bold shadow-neo-sm whitespace-nowrap active:translate-y-[1px] active:shadow-none">
                        Terbaru
                    </button>
                    <button className="bg-white dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded-full border-2 border-black dark:border-gray-600 text-sm font-bold shadow-neo-sm whitespace-nowrap active:translate-y-[1px] active:shadow-none">
                        Rating Tinggi
                    </button>
                    <button className="bg-white dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded-full border-2 border-black dark:border-gray-600 text-sm font-bold shadow-neo-sm whitespace-nowrap active:translate-y-[1px] active:shadow-none">
                        Dengan Foto
                    </button>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                    {reviewsData.reviews.map((review) => (
                        <div key={review.id} className={`${review.bgColor} border-3 border-black dark:border-gray-500 rounded-xl p-4 shadow-neo`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border-2 border-black dark:border-gray-400 bg-white overflow-hidden flex items-center justify-center">
                                        {review.avatar ? (
                                            <img
                                                src={review.avatar}
                                                alt={review.userName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="font-black text-gray-500">{review.initials}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-black dark:text-white text-sm">{review.userName}</h3>
                                        <span className={`text-xs font-bold ${review.bgColor === "bg-neo-blue dark:bg-blue-900/50" ? "text-white/90" : "text-gray-700 dark:text-gray-300"
                                            }`}>
                                            {review.timeAgo}
                                        </span>
                                    </div>
                                </div>
                                <div className={`flex ${review.bgColor === "bg-white dark:bg-gray-800" ? "bg-gray-100 dark:bg-gray-700" : "bg-white dark:bg-gray-800"
                                    } px-2 py-1 rounded border-2 border-black dark:border-gray-600`}>
                                    <Star className="text-yellow-500 w-4 h-4 fill-current mr-1" />
                                    <span className="text-xs font-black">{review.rating}</span>
                                </div>
                            </div>
                            <p className={`text-sm font-semibold leading-relaxed mb-3 ${review.bgColor === "bg-neo-blue dark:bg-blue-900/50" ? "text-white dark:text-gray-100" : "text-black dark:text-gray-200"
                                }`}>
                                {review.comment}
                            </p>
                            <div className="flex gap-2">
                                {review.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className={`px-2 py-1 rounded border text-[10px] font-bold ${review.bgColor === "bg-secondary dark:bg-yellow-900/50"
                                            ? "bg-white/50 dark:bg-black/30 border-black dark:border-gray-600"
                                            : review.bgColor === "bg-neo-blue dark:bg-blue-900/50"
                                                ? "bg-white/20 border-white text-white"
                                                : "bg-gray-100 dark:bg-gray-700 border-black dark:border-gray-600"
                                            }`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Write Review Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <button className="bg-black dark:bg-white text-white dark:text-black rounded-full p-4 shadow-neo border-2 border-black dark:border-gray-400 active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2 group">
                    <Edit className="w-6 h-6" />
                    <span className="font-bold pr-1 hidden group-hover:block md:block">Tulis Ulasan</span>
                </button>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </main>
    )
}
