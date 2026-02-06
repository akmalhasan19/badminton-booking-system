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
                                            <div className="w-10 h-10 rounded-full bg-pastel-yellow border-2 border-black flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5" />
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
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white border-3 border-black shadow-hard z-50 p-6 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black uppercase">Booking Details</h2>
                                <p className="font-mono text-gray-500 text-sm">#{booking.id}</p>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded border-2 border-transparent hover:border-black transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* User Info */}
                            <div className="bg-gray-50 p-4 border-2 border-gray-200 rounded-lg">
                                <h3 className="font-black uppercase text-sm mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Guest Information
                                </h3>
                                <div className="space-y-1">
                                    <p className="font-bold">{booking.users?.full_name || 'Guest'}</p>
                                    <p className="text-sm text-gray-600">{booking.users?.email}</p>
                                    <p className="text-sm text-gray-600">{booking.users?.phone || '-'}</p>
                                </div>
                            </div>

                            {/* Booking Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 bg-pastel-blue/20 p-4 border-2 border-neo-blue rounded-lg">
                                    <h3 className="font-black uppercase text-sm mb-3 text-neo-blue flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Venue & Court
                                    </h3>
                                    <p className="text-lg font-black">{booking.venues?.name || 'Unknown Venue'}</p>
                                    <p className="font-medium text-gray-600">{booking.courts?.name}</p>
                                </div>

                                <div className="bg-gray-50 p-4 border-2 border-gray-200 rounded-lg">
                                    <h3 className="font-black uppercase text-sm mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Date
                                    </h3>
                                    <p className="font-medium">{booking.booking_date}</p>
                                </div>

                                <div className="bg-gray-50 p-4 border-2 border-gray-200 rounded-lg">
                                    <h3 className="font-black uppercase text-sm mb-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Time
                                    </h3>
                                    <p className="font-medium">{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</p>
                                </div>
                            </div>

                            {/* Status & Price */}
                            <div className="flex items-center justify-between p-4 border-2 border-black bg-pastel-yellow/30 rounded-lg">
                                <div>
                                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Total Price</p>
                                    <p className="text-xl font-black">Rp {booking.total_price?.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Status</p>
                                    <StatusBadge status={booking.status} />
                                </div>
                            </div>

                            {/* Actions */}
                            {booking.status === 'pending' && (
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t-2 border-dashed border-gray-200">
                                    <button
                                        onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                                        disabled={isUpdating}
                                        className="w-full py-3 bg-red-100 text-red-700 border-2 border-red-200 font-bold hover:bg-red-200 hover:border-red-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                                        disabled={isUpdating}
                                        className="w-full py-3 bg-neo-green text-black border-2 border-black font-black hover:bg-green-400 hover:shadow-hard-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Confirm Booking
                                    </button>
                                </div>
                            )}

                            {booking.status === 'confirmed' && (
                                <div className="pt-4 border-t-2 border-dashed border-gray-200">
                                    <button
                                        onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                                        disabled={isUpdating}
                                        className="w-full py-3 bg-red-100 text-red-700 border-2 border-red-200 font-bold hover:bg-red-200 hover:border-red-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                        Cancel Booking
                                    </button>
                                </div>
                            )}
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
