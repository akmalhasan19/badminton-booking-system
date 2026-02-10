"use client"

import { useState, useTransition } from "react"
import { Report, resolveReport } from "@/app/reports/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Clock, CheckCircle, XCircle, User, AlertTriangle } from "lucide-react"

interface ReportsClientProps {
    initialReports: Report[]
}

export function ReportsClient({ initialReports }: ReportsClientProps) {
    const router = useRouter()
    const [reports, setReports] = useState(initialReports)
    const [isPending, startTransition] = useTransition()
    const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all')

    const handleResolve = (reportId: string, action: string, notes?: string) => {
        startTransition(async () => {
            const result = await resolveReport(reportId, action, notes)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Report ${action === 'dismiss' ? 'dismissed' : 'resolved'} successfully`)
                router.refresh()
            }
        })
    }

    const filteredReports = filter === 'all'
        ? reports
        : reports.filter(r => r.status === filter)

    const getTargetTypeIcon = (type: string) => {
        switch (type) {
            case 'community': return '🏘️'
            case 'message': return '💬'
            case 'review': return '⭐'
            case 'user': return '👤'
            default: return '📄'
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 border-2 border-yellow-600 rounded-lg text-xs font-bold uppercase">Pending</span>
            case 'resolved':
                return <span className="px-3 py-1 bg-green-100 text-green-800 border-2 border-green-600 rounded-lg text-xs font-bold uppercase">Resolved</span>
            case 'dismissed':
                return <span className="px-3 py-1 bg-gray-100 text-gray-800 border-2 border-gray-600 rounded-lg text-xs font-bold uppercase">Dismissed</span>
            default:
                return <span className="px-3 py-1 bg-blue-100 text-blue-800 border-2 border-blue-600 rounded-lg text-xs font-bold uppercase">{status}</span>
        }
    }

    return (
        <div>
            {/* Filters */}
            <div className="mb-6 flex gap-3 flex-wrap">
                {(['all', 'pending', 'resolved', 'dismissed'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl font-bold border-2 transition-all ${filter === f
                                ? 'bg-black text-white border-black shadow-neo-sm'
                                : 'bg-white dark:bg-gray-800 text-black dark:text-white border-black dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                {filteredReports.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <p className="font-bold text-gray-500">No reports found.</p>
                    </div>
                ) : (
                    filteredReports.map((report) => (
                        <div
                            key={report.id}
                            className="bg-white dark:bg-gray-800 border-3 border-black dark:border-gray-600 rounded-2xl p-6 shadow-neo"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{getTargetTypeIcon(report.target_type)}</span>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-black text-lg">
                                                {report.target_type.charAt(0).toUpperCase() + report.target_type.slice(1)} Report
                                            </h3>
                                            {getStatusBadge(report.status)}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Reported by: {report.reporter?.full_name || 'Unknown'} ({report.reporter?.email || 'N/A'})
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 font-bold">
                                    {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="font-bold text-sm mb-1">Reason:</p>
                                <p className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                                    {report.reason}
                                </p>
                            </div>

                            {report.description && (
                                <div className="mb-4">
                                    <p className="font-bold text-sm mb-1">Description:</p>
                                    <p className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                                        {report.description}
                                    </p>
                                </div>
                            )}

                            <div className="mb-4 text-xs text-gray-500 font-mono">
                                <p>Target ID: {report.target_id}</p>
                            </div>

                            {/* Actions */}
                            {report.status === 'pending' && (
                                <div className="flex gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => handleResolve(report.id, 'resolve', 'Report resolved by admin')}
                                        disabled={isPending}
                                        className="flex-1 bg-green-500 text-white px-4 py-2.5 rounded-xl border-2 border-black font-black uppercase text-sm shadow-neo-sm hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Resolve
                                    </button>
                                    <button
                                        onClick={() => handleResolve(report.id, 'dismiss', 'Report dismissed - no violation found')}
                                        disabled={isPending}
                                        className="flex-1 bg-gray-500 text-white px-4 py-2.5 rounded-xl border-2 border-black font-black uppercase text-sm shadow-neo-sm hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
