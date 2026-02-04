'use client'

import { useState } from 'react'
import { updateBookingStatus } from './actions'
import { toast } from 'sonner'
import { Check, X, Eye, Loader2, Calendar } from 'lucide-react'

export function BookingTable({ bookings }: { bookings: any[] }) {
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const handleStatusUpdate = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
        setUpdatingId(id)
        try {
            const res = await updateBookingStatus(id, newStatus)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(`Booking ${newStatus}!`)
            }
        } catch {
            toast.error('Something went wrong')
        } finally {
            setUpdatingId(null)
        }
    }

    if (!bookings.length) {
        return (
            <div className="p-12 text-center bg-white border-3 border-neo-black shadow-hard">
                <p className="font-display font-bold text-lg text-gray-500">No bookings found</p>
            </div>
        )
    }

    return (
        <div className="bg-white border-3 border-neo-black shadow-hard overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-neo-black text-white uppercase font-mono text-sm">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">User</th>
                            <th className="p-4">Court</th>
                            <th className="p-4">Date/Time</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-100 font-medium">
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="p-4 font-mono text-xs text-gray-500">
                                    {booking.id.slice(0, 8)}...
                                </td>
                                <td className="p-4">
                                    <div className="font-bold">{booking.users?.full_name || 'Guest'}</div>
                                    <div className="text-xs text-gray-500 font-mono">{booking.users?.email}</div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-neo-blue/20 text-neo-blue border border-neo-blue px-2 py-0.5 rounded text-xs font-bold uppercase">
                                        {booking.courts?.name}
                                    </span>
                                </td>
                                <td className="p-4 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        {booking.booking_date}
                                    </div>
                                    <div className="text-gray-500 font-mono text-xs mt-1">
                                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                    </div>
                                </td>
                                <td className="p-4 font-mono">
                                    Rp {booking.total_price?.toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={booking.status} />
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {booking.status === 'pending' && (
                                            <>
                                                <button
                                                    disabled={!!updatingId}
                                                    onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                    className="p-1.5 bg-neo-green text-black border-2 border-neo-black shadow-xs hover:shadow-hard-sm transition-all disabled:opacity-50"
                                                    title="Confirm"
                                                >
                                                    {updatingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    disabled={!!updatingId}
                                                    onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                    className="p-1.5 bg-red-400 text-black border-2 border-neo-black shadow-xs hover:shadow-hard-sm transition-all disabled:opacity-50"
                                                    title="Reject"
                                                >
                                                    {updatingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                </button>
                                            </>
                                        )}
                                        {booking.status === 'confirmed' && (
                                            <button
                                                disabled={!!updatingId}
                                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                className="p-1.5 bg-red-400 text-black border-2 border-neo-black shadow-xs hover:shadow-hard-sm transition-all disabled:opacity-50"
                                                title="Cancel Booking"
                                            >
                                                {updatingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        confirmed: 'bg-neo-green text-black border-neo-black',
        cancelled: 'bg-red-100 text-red-800 border-red-300',
        completed: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    const style = styles[status as keyof typeof styles] || styles.completed

    return (
        <span className={`px-2 py-1 rounded text-xs font-black uppercase border-2 ${style}`}>
            {status}
        </span>
    )
}
