'use client'

import { useState } from 'react'
import { updateBookingStatus } from './actions'
import { toast } from 'sonner'
import { Check, X, Eye, Loader2, Calendar, MapPin, Clock, DollarSign, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function BookingTable({ bookings }: { bookings: any[] }) {
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null)

    const handleStatusUpdate = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
        setUpdatingId(id)
        try {
            const res = await updateBookingStatus(id, newStatus)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(`Booking ${newStatus}!`)
                // Close modal if open
                if (selectedBooking?.id === id) {
                    setSelectedBooking(null)
                }
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
        <>
            <div className="bg-white border-3 border-neo-black shadow-hard overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neo-black text-white uppercase font-mono text-sm">
                            <tr>
                                <th className="p-4">Booking ID</th>
                                <th className="p-4">User</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-gray-100 font-medium">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4 font-mono text-sm text-gray-500">
                                        #{booking.id.slice(0, 8)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-pastel-yellow border-2 border-black flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {booking.users?.avatar_url ? (
                                                    <img
                                                        src={booking.users.avatar_url}
                                                        alt={booking.users.full_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold">{booking.users?.full_name || 'Guest'}</div>
                                                <div className="text-xs text-gray-500 font-mono">{booking.users?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedBooking(booking)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-black font-bold text-sm hover:bg-neo-black hover:text-white transition-all shadow-sm hover:shadow-hard-sm"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <BookingDetailsModal
                booking={selectedBooking}
                isOpen={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onUpdateStatus={handleStatusUpdate}
                isUpdating={!!updatingId}
            />
        </>
    )
}

function BookingDetailsModal({ booking, isOpen, onClose, onUpdateStatus, isUpdating }: any) {
    if (!booking) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white border-3 border-black shadow-hard z-50 rounded-xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        <div className="flex justify-between items-center p-6 border-b-2 border-gray-100 flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight">Booking Details</h2>
                                <p className="font-mono text-gray-500 text-sm mt-1">#{booking.id}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg border-2 border-transparent hover:border-black transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            <div className="space-y-6">
                                {/* User Header */}
                                <div className="flex items-center gap-4 bg-neo-bg p-4 border-2 border-neo-black shadow-hard-sm">
                                    <div className="w-16 h-16 rounded-full bg-white border-2 border-neo-black flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {booking.users?.avatar_url ? (
                                            <img
                                                src={booking.users.avatar_url}
                                                alt={booking.users.full_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl uppercase tracking-tight">{booking.users?.full_name || 'Guest User'}</h3>
                                        <div className="flex flex-col text-sm font-mono text-gray-600">
                                            <span>{booking.users?.email}</span>
                                            {booking.users?.phone && <span>{booking.users.phone}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Status & Price Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 border-2 border-neo-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <p className="text-xs font-black uppercase text-gray-500 mb-1">Total Amount</p>
                                        <p className="text-2xl font-black tracking-tight text-neo-green-dark">
                                            Rp {booking.total_price?.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 border-2 border-neo-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                                        <p className="text-xs font-black uppercase text-gray-500 mb-1">Current Status</p>
                                        <div>
                                            <StatusBadge status={booking.status} />
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Details */}
                                <div className="bg-gray-50 p-6 border-2 border-gray-200 rounded-none relative">
                                    <div className="absolute top-0 right-0 bg-neo-black text-white text-xs font-bold px-3 py-1 uppercase">
                                        Booking Information
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-500 uppercase mb-1 flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" /> Venue
                                                </h4>
                                                <p className="font-black text-lg leading-tight">
                                                    {booking.venue_id || booking.courts?.name?.split('(')[0]?.trim() || 'Unknown Venue'}
                                                </p>
                                                <p className="text-sm font-medium text-gray-600 mt-1 pl-6 border-l-2 border-gray-300">
                                                    {booking.courts?.name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-500 uppercase mb-1 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" /> Schedule
                                                </h4>
                                                <p className="font-mono font-bold text-lg">
                                                    {booking.booking_date}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 text-neo-blue font-bold bg-blue-50 w-fit px-2 py-1 rounded border border-blue-200">
                                                    <Clock className="w-4 h-4" />
                                                    {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {booking.status === 'pending' && (
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <button
                                            onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                                            disabled={isUpdating}
                                            className="w-full py-4 bg-white text-red-600 border-3 border-red-200 font-black hover:bg-red-50 hover:border-red-500 transition-all flex items-center justify-center gap-2 uppercase tracking-wide group"
                                        >
                                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                            Reject Booking
                                        </button>
                                        <button
                                            onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                                            disabled={isUpdating}
                                            className="w-full py-4 bg-neo-green text-black border-3 border-black font-black hover:bg-green-400 hover:shadow-hard transition-all flex items-center justify-center gap-2 uppercase tracking-wide group hover:-translate-y-1"
                                        >
                                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                            Confirm Booking
                                        </button>
                                    </div>
                                )}

                                {booking.status === 'confirmed' && (
                                    <div className="mt-6">
                                        <button
                                            onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                                            disabled={isUpdating}
                                            className="w-full py-4 bg-white text-red-600 border-3 border-red-200 font-black hover:bg-red-50 hover:border-red-500 transition-all flex items-center justify-center gap-2 uppercase tracking-wide group"
                                        >
                                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                            Cancel Booking
                                        </button>
                                        <p className="text-center text-xs text-gray-500 mt-2 font-mono">
                                            Warning: This action cannot be undone easily.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: 'bg-red-100 text-red-800 border-red-300',
        confirmed: 'bg-neo-green text-black border-neo-black',
        cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
        completed: 'bg-blue-100 text-blue-800 border-blue-300',
    }
    const style = styles[status as keyof typeof styles] || styles.completed

    return (
        <span className={`px-2 py-1 rounded text-xs font-black uppercase border-2 ${style}`}>
            {status}
        </span>
    )
}
