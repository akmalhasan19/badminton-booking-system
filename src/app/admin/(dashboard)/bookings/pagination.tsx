'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    totalPages: number
}

export function Pagination({ totalPages }: PaginationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentPage = Number(searchParams.get('page')) || 1

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', pageNumber.toString())
        return `?${params.toString()}`
    }

    const handlePageChange = (page: number) => {
        router.push(createPageURL(page))
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 bg-white border-2 border-neo-black shadow-hard-sm disabled:opacity-50 disabled:shadow-none transition-all hover:bg-gray-50 active:translate-y-0.5 active:shadow-none"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 flex items-center justify-center font-black border-2 border-neo-black text-sm transition-all
                            ${currentPage === page
                                ? 'bg-neo-black text-white shadow-hard-sm'
                                : 'bg-white hover:bg-pastel-yellow shadow-hard-sm hover:-translate-y-0.5'
                            }`}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 bg-white border-2 border-neo-black shadow-hard-sm disabled:opacity-50 disabled:shadow-none transition-all hover:bg-gray-50 active:translate-y-0.5 active:shadow-none"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    )
}
