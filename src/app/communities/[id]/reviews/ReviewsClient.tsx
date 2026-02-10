"use client"

import { ArrowLeft, Star, Edit, Search, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { CommunityReview, CommunityStats, createCommunityReview } from "../../actions"

const DESKTOP_REVIEW_THEMES = [
    {
        card: "bg-secondary dark:bg-red-700",
        text: "text-black dark:text-white",
        time: "text-black/70 dark:text-white/70",
        tag: "bg-white/30 dark:bg-white/20 text-black dark:text-white border-black/20 dark:border-white/20",
        badge: "bg-white dark:bg-zinc-900",
        badgeText: "text-black dark:text-white"
    },
    {
        card: "bg-neo-blue dark:bg-blue-700",
        text: "text-white",
        time: "text-white/70",
        tag: "bg-white/20 text-white border-white/30",
        badge: "bg-white dark:bg-zinc-900",
        badgeText: "text-black dark:text-white"
    },
    {
        card: "bg-primary dark:bg-yellow-600",
        text: "text-black dark:text-white",
        time: "text-black/70 dark:text-white/70",
        tag: "bg-black/10 dark:bg-black/30 text-black dark:text-white border-black/20 dark:border-white/20",
        badge: "bg-white dark:bg-zinc-900",
        badgeText: "text-black dark:text-white"
    }
]

interface ReviewsClientProps {
    communityId: string
    initialReviews: CommunityReview[]
    stats: CommunityStats
    initialTotalCount: number
}

function timeAgo(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " tahun lalu"
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " bulan lalu"
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " hari lalu"
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " jam lalu"
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " menit lalu"
    return "Baru saja"
}

export default function ReviewsClient({ communityId, initialReviews, stats, initialTotalCount }: ReviewsClientProps) {
    const router = useRouter()
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
    const [reviews, setReviews] = useState(initialReviews)

    // Write Review State
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")
    const [tags, setTags] = useState<string[]>([])
    const [newTag, setNewTag] = useState("")
    const [isSubmitting, startTransition] = useTransition()
    const [submitError, setSubmitError] = useState<string | null>(null)

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault()
            if (!tags.includes(newTag.trim())) {
                setTags([...tags, newTag.trim()])
            }
            setNewTag("")
        }
    }

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitError(null)

        startTransition(async () => {
            const result = await createCommunityReview(communityId, rating, comment, tags)
            if (result.error) {
                setSubmitError(result.error)
            } else if (result.success && result.data) {
                setIsWriteModalOpen(false)
                // Add new review to top of list optimistically or refresh
                // Since user object in result.data might rely on join which insert return might not have fully
                // ideally we refresh or reconstruct user object
                router.refresh()
            }
        })
    }


    return (
        <main className="min-h-screen bg-background-light dark:bg-background-dark font-display text-text-light dark:text-text-dark transition-colors duration-200">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-primary dark:bg-red-900 border-b-3 border-black dark:border-gray-700 px-4 py-4 lg:px-6 lg:py-5 flex items-center shadow-neo dark:shadow-none">
                <button
                    onClick={() => router.back()}
                    className="p-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 rounded-lg shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all mr-4"
                >
                    <ArrowLeft className="text-black dark:text-white w-6 h-6" />
                </button>
                <h1 className="text-xl lg:text-2xl font-bold text-black dark:text-white tracking-wide">Ulasan Komunitas</h1>
            </header>

            <div className="lg:hidden">
                <div className="p-4 max-w-md mx-auto pb-20">
                    {/* Rating Summary Card */}
                    <div className="bg-white dark:bg-gray-800 border-3 border-black dark:border-gray-600 rounded-xl p-5 shadow-neo mb-6 relative overflow-hidden">
                        {/* Decorative Corner */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-secondary dark:bg-yellow-600 rounded-bl-full border-l-3 border-b-3 border-black dark:border-gray-600 -mr-[3px] -mt-[3px]"></div>

                        {/* Overall Rating */}
                        <div className="flex items-end gap-8 mb-4">
                            {/* Left side - Rating number */}
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-black dark:text-white">{stats.overallRating}</span>
                                <span className="text-gray-500 dark:text-gray-400 font-bold text-lg">/5</span>
                            </div>

                            {/* Right side - Stars and review count */}
                            <div className="flex flex-col justify-center">
                                <div className="flex text-secondary dark:text-yellow-500 mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-5 h-5 ${i < Math.round(stats.overallRating) ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                                    ))}
                                </div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    Based on {stats.totalReviews} reviews
                                </p>
                            </div>
                        </div>

                        {/* Category Filters */}
                        <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar pb-2">
                            {stats.categories.map((category, index) => (
                                <button
                                    key={index}
                                    className={`flex-shrink-0 ${category.isActive
                                        ? "bg-primary text-white"
                                        : "bg-white dark:bg-gray-700 text-black dark:text-white group hover:bg-gray-50 dark:hover:bg-gray-600"
                                        } border-2 border-black dark:border-gray-${category.isActive ? '900' : '500'} rounded-lg py-2 px-3 shadow-neo-sm active:translate-y-[2px] active:shadow-none transition-all flex flex-col items-center justify-center min-w-[80px]`}
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
                            {stats.criteria.map((criterion, index) => (
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
                        {/* Add logic for filters later */}
                        <button className="bg-white dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded-full border-2 border-black dark:border-gray-600 text-sm font-bold shadow-neo-sm whitespace-nowrap active:translate-y-[1px] active:shadow-none">
                            Terbaru
                        </button>
                        <button className="bg-white dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded-full border-2 border-black dark:border-gray-600 text-sm font-bold shadow-neo-sm whitespace-nowrap active:translate-y-[1px] active:shadow-none">
                            Rating Tinggi
                        </button>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-4">
                        {reviews.map((review, index) => {
                            const theme = DESKTOP_REVIEW_THEMES[index % DESKTOP_REVIEW_THEMES.length]
                            return (
                                <div key={review.id} className={`${theme.card} border-3 border-black dark:border-gray-500 rounded-xl p-4 shadow-neo`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full border-2 border-black dark:border-gray-400 bg-white overflow-hidden flex items-center justify-center">
                                                {review.user.avatar_url ? (
                                                    <img
                                                        src={review.user.avatar_url}
                                                        alt={review.user.full_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="font-black text-gray-500">{review.user.full_name.slice(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className={`font-black text-sm ${theme.text}`}>{review.user.full_name}</h3>
                                                <span className={`text-xs font-bold ${theme.time}`}>
                                                    {timeAgo(review.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`flex bg-white dark:bg-gray-800 px-2 py-1 rounded border-2 border-black dark:border-gray-600`}>
                                            <Star className="text-yellow-500 w-4 h-4 fill-current mr-1" />
                                            <span className="text-xs font-black dark:text-white">{review.rating}</span>
                                        </div>
                                    </div>
                                    <p className={`text-sm font-semibold leading-relaxed mb-3 ${theme.text}`}>
                                        {review.comment}
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {review.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className={`px-2 py-1 rounded border text-[10px] font-bold ${theme.tag}`}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                        {reviews.length === 0 && (
                            <div className="text-center py-10 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-400">
                                <p className="font-bold text-gray-500">Belum ada ulasan.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop View - Simplified for brevity, utilizing same data */}
            <div className="hidden lg:block">
                <div className="relative">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-20 -right-16 w-[420px] h-[420px] bg-primary/30 rounded-full blur-3xl" />
                        <div className="absolute -bottom-24 -left-10 w-[360px] h-[360px] bg-neo-blue/30 rounded-full blur-3xl" />
                    </div>
                    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8 relative z-10">
                        <aside className="col-span-4 space-y-6">
                            <div className="sticky top-28 bg-white/90 dark:bg-zinc-900/80 border-4 border-black dark:border-gray-600 rounded-2xl p-6 shadow-neo-lg relative overflow-hidden backdrop-blur">
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-secondary rounded-full border-4 border-black dark:border-gray-600"></div>
                                <div className="relative z-10">
                                    <div className="flex items-end gap-3 mb-2">
                                        <span className="text-6xl font-black text-black dark:text-white">{stats.overallRating}</span>
                                        <span className="text-2xl text-gray-500 dark:text-gray-400 font-bold mb-2">/5</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-secondary dark:text-yellow-500 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-5 h-5 ${i < Math.round(stats.overallRating) ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                                        ))}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-6">
                                        Based on {stats.totalReviews} reviews
                                    </p>

                                    {/* Stats Criteria Desktop */}
                                    <div className="space-y-4">
                                        {stats.criteria.map((criterion, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-bold text-black dark:text-white">{criterion.name}</span>
                                                    <span className={`text-sm font-black ${criterion.color === 'bg-neo-blue' ? 'text-neo-blue dark:text-blue-400' :
                                                        criterion.color === 'bg-secondary' ? 'text-secondary dark:text-yellow-400' :
                                                            criterion.color === 'bg-green-500' ? 'text-green-500 dark:text-green-400' :
                                                                'text-primary dark:text-red-400'
                                                        }`}>
                                                        {criterion.rating}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 border-2 border-black dark:border-gray-600">
                                                    <div className={`${criterion.color} h-full rounded-l-full border-r-2 border-black dark:border-gray-600`} style={{ width: `${criterion.percentage}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <section className="col-span-8">
                            {/* Filters & Search Desktop */}
                            <div className="mb-8 space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <button className="bg-black text-white px-5 py-2 rounded-full border-2 border-black font-bold shadow-neo-sm hover:-translate-y-0.5 transition-transform text-sm">
                                        Semua
                                    </button>
                                    <button className="bg-white dark:bg-zinc-800 text-black dark:text-white px-5 py-2 rounded-full border-2 border-black dark:border-gray-600 font-bold shadow-neo-sm hover:bg-gray-50 dark:hover:bg-zinc-700 hover:-translate-y-0.5 transition-transform text-sm">
                                        Terbaru
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6 pb-24">
                                {reviews.map((review, index) => {
                                    const theme = DESKTOP_REVIEW_THEMES[index % DESKTOP_REVIEW_THEMES.length]

                                    return (
                                        <article
                                            key={review.id}
                                            className={`${theme.card} border-4 border-black dark:border-gray-600 rounded-2xl p-6 shadow-neo-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm transition-all duration-200`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full border-2 border-black dark:border-gray-600 bg-white overflow-hidden flex items-center justify-center">
                                                        {review.user.avatar_url ? (
                                                            <img
                                                                src={review.user.avatar_url}
                                                                alt={review.user.full_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="font-black text-gray-500">{review.user.full_name.slice(0, 2).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-black text-lg leading-tight ${theme.text}`}>{review.user.full_name}</h3>
                                                        <p className={`text-xs font-bold ${theme.time}`}>{timeAgo(review.created_at)}</p>
                                                    </div>
                                                </div>
                                                <div className={`border-2 border-black dark:border-gray-600 px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm ${theme.badge}`}>
                                                    <Star className="text-yellow-500 w-4 h-4 fill-current" />
                                                    <span className={`font-black text-sm ${theme.badgeText}`}>{review.rating}</span>
                                                </div>
                                            </div>
                                            <p className={`font-bold text-base mb-4 leading-relaxed ${theme.text}`}>
                                                {review.comment}
                                            </p>
                                            <div className="flex gap-2 flex-wrap">
                                                {review.tags.map((tag, tagIndex) => (
                                                    <span
                                                        key={tagIndex}
                                                        className={`inline-block px-3 py-1 rounded-lg text-xs font-black border ${theme.tag}`}
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </article>
                                    )
                                })}
                                {reviews.length === 0 && (
                                    <div className="text-center py-12 bg-white/50 dark:bg-zinc-800/50 rounded-2xl border-4 border-dashed border-black/20 dark:border-white/20">
                                        <p className="font-bold text-xl text-gray-500 dark:text-gray-400">Belum ada ulasan.</p>
                                        <p className="text-gray-500 dark:text-gray-400 mt-2">Jadilah yang pertama menulis ulasan!</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Floating Write Review Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setIsWriteModalOpen(true)}
                    className="bg-black dark:bg-white text-white dark:text-black rounded-full p-4 shadow-neo border-2 border-black dark:border-gray-400 active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2 group"
                >
                    <Edit className="w-6 h-6" />
                    <span className="font-bold pr-1 hidden group-hover:block md:block">Tulis Ulasan</span>
                </button>
            </div>

            {/* Write Review Modal */}
            {isWriteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl border-4 border-black dark:border-gray-600 shadow-hard overflow-hidden">
                        <div className="bg-primary dark:bg-red-900 p-4 border-b-4 border-black dark:border-gray-600 flex justify-between items-center">
                            <h2 className="font-black text-lg text-black dark:text-white uppercase tracking-wider">Tulis Ulasan</h2>
                            <button onClick={() => setIsWriteModalOpen(false)} className="bg-white dark:bg-zinc-800 p-1 rounded-full border-2 border-black dark:border-gray-600 hover:scale-105 active:scale-95 transition-transform">
                                <X className="w-5 h-5 text-black dark:text-white" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
                            {submitError && (
                                <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold rounded-lg text-sm">
                                    {submitError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition-transform hover:scale-110 active:scale-90"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
                                                strokeWidth={2.5}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Komentar</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 border-2 border-black dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-0 focus:border-neo-blue dark:focus:border-blue-500 font-medium resize-none"
                                    placeholder="Ceritakan pengalamanmu..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Tags (Tekan Enter)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map((tag, index) => (
                                        <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-zinc-700 border border-black dark:border-gray-500 rounded text-xs font-bold">
                                            #{tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    className="w-full p-3 border-2 border-black dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-0 focus:border-neo-blue dark:focus:border-blue-500 font-medium text-sm"
                                    placeholder="Contoh: Kompetitif, Santai, Lapangan Bagus"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-black dark:bg-white text-white dark:text-black font-black py-4 rounded-xl border-2 border-transparent shadow-neo hover:shadow-none hover:translate-y-1 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Mengirim...
                                    </>
                                ) : (
                                    "Kirim Ulasan"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

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
