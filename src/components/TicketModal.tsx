"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, Share2, Calendar, Clock, MapPin, CheckCircle2 } from "lucide-react"
import QRCode from "react-qr-code"
import { toPng } from "html-to-image"
import { toast } from "sonner"
import type { Booking } from "@/app/bookings/actions"

interface TicketModalProps {
    isOpen: boolean
    onClose: () => void
    booking: Booking | null
    user: any
}

export function TicketModal({ isOpen, onClose, booking, user }: TicketModalProps) {
    const ticketRef = useRef<HTMLDivElement>(null)
    const [isDownloading, setIsDownloading] = useState(false)

    if (!isOpen || !booking) return null

    const handleDownload = async () => {
        if (!ticketRef.current) return
        setIsDownloading(true)
        try {
            const dataUrl = await toPng(ticketRef.current, { cacheBust: true, backgroundColor: 'white' })
            const link = document.createElement('a')
            link.download = `smash-ticket-${booking.id.slice(0, 8)}.png`
            link.href = dataUrl
            link.click()
            toast.success("E-Ticket downloaded successfully!")
        } catch (err) {
            console.error(err)
            toast.error("Failed to download ticket")
        } finally {
            setIsDownloading(false)
        }
    }

    const handleShare = async () => {
        const shareData = {
            title: 'My Smash Booking',
            text: `Booked ${booking.court_name} on ${booking.date} at ${booking.start_time}`,
            url: `https://smashpartner.online/verify/${booking.id}`
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (err) {
                console.error("Error sharing", err)
            }
        } else {
            navigator.clipboard.writeText(shareData.url)
            toast.success("Link copied to clipboard!")
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-[380px] relative max-h-[85vh] overflow-y-auto scrollbar-hide rounded-3xl"
                >
                    {/* Close Button - Sticky or Fixed? Fixed relative to modal if possible, but inside scroll it might move. 
                        Better to put it sticky or outside the scroll view? 
                        The user asked for scroll *in* the modal.
                        If I put overflow on this div, the close button needs to be inside or sticky.
                    */}
                    <div className="sticky top-0 right-0 z-[90] flex justify-end p-4 pointer-events-none">
                        <button
                            onClick={onClose}
                            className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all shadow-sm border border-gray-200 pointer-events-auto"
                        >
                            <X className="w-5 h-5 text-black" />
                        </button>
                    </div>

                    {/* Ticket Container for Capture */}
                    <div ref={ticketRef} className="bg-white rounded-3xl overflow-hidden border-4 border-black shadow-2xl">
                        {/* Header */}
                        <div className="bg-black text-white p-6 text-center border-b-4 border-black relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-3xl font-display font-black tracking-tighter uppercase">BOARDING PASS</h2>
                                <p className="text-pastel-lilac font-bold tracking-widest text-xs mt-1">SMASH ARENA ACCESS</p>
                            </div>
                            {/* Decorative Background Pattern */}
                            <div className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                                    backgroundSize: '10px 10px'
                                }}
                            />
                        </div>

                        {/* Main Content */}
                        <div className="p-6 space-y-6">
                            {/* QR Code Section */}
                            <div className="flex justify-center py-4 bg-gray-50 rounded-2xl border-2 border-gray-200 border-dashed">
                                <div className="p-4 bg-white rounded-xl border-2 border-black shadow-hard-sm">
                                    <QRCode
                                        value={`https://smashpartner.online/verify/${booking.id}`}
                                        size={180}
                                        viewBox={`0 0 256 256`}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        level="H"
                                    />
                                </div>
                            </div>

                            {/* Booking Details */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">COURT</p>
                                    <h3 className="text-2xl font-black font-display text-black">{booking.court_name}</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> DATE
                                        </p>
                                        <p className="text-lg font-bold text-black border-b-2 border-gray-100 pb-1">
                                            {new Date(booking.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                                            <Clock className="w-3 h-3" /> TIME
                                        </p>
                                        <p className="text-lg font-bold text-black border-b-2 border-gray-100 pb-1">
                                            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">PLAYER</p>
                                    <p className="text-lg font-bold text-black truncate">{user.name}</p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex justify-center">
                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pastel-mint border-2 border-black text-xs font-black uppercase text-black shadow-hard-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Booking Confirmed
                                </span>
                            </div>

                            <div className="text-center pt-2">
                                <p className="text-[10px] text-gray-400 font-mono uppercase">ID: {booking.id}</p>
                            </div>
                        </div>

                        {/* Rip-off Design Element */}
                        <div className="relative h-4 bg-black mx-1 rounded-full opacity-10 mb-2"></div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-hard active:translate-y-1 active:shadow-none border-2 border-black"
                        >
                            <Download className="w-5 h-5" />
                            {isDownloading ? 'Saving...' : 'Save Ticket'}
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 bg-white text-black px-4 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-hard active:translate-y-1 active:shadow-none border-2 border-black"
                        >
                            <Share2 className="w-5 h-5" />
                            Share
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
