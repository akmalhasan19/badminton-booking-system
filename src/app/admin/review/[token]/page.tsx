"use client"

import { useEffect, useState } from "react"
import { getApplicationByToken } from "../actions"
import { PLAN_FEATURES, SubscriptionPlan } from "@/lib/constants/plans"
import { approveApplication, rejectApplication } from "@/app/partner/actions"
import { toast } from "sonner"
import { motion } from "framer-motion"
import {
    User, Mail, Phone, Building2, MapPin, Hash, Globe, Layout,
    Users, CheckCircle, XCircle, Loader2, ExternalLink, ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { ConfirmDialog } from "./ConfirmDialog"

type ApplicationData = {
    id: string
    owner_name: string
    email: string
    phone: string
    venue_name: string
    venue_address: string
    venue_latitude: number | null
    venue_longitude: number | null
    social_media: string
    website: string | null
    flooring_material: string
    routine_clubs: string
    goals: string[]
    subscription_plan: SubscriptionPlan | null
    status: string
    created_at: string
}

export default function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
    const [application, setApplication] = useState<ApplicationData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [showApproveDialog, setShowApproveDialog] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)


    useEffect(() => {
        params.then(p => setToken(p.token))
    }, [params])

    useEffect(() => {
        if (!token) return

        const fetchApplication = async () => {
            setIsLoading(true)

            // Use server action to bypass RLS (token-based access)
            const result = await getApplicationByToken(token)

            if (result.error) {
                // console.error('Fetch error:', result.error)
                setError('Application not found or invalid token.')
            } else {
                setApplication(result.data)
            }
            setIsLoading(false)
        }

        fetchApplication()
    }, [token])


    const handleApproveClick = () => {
        setShowApproveDialog(true)
    }

    const handleApproveConfirm = async () => {
        if (!application) return

        setIsProcessing(true)
        try {
            const result = await approveApplication(application.id)

            if (result.success) {
                if (result.emailSent === false) {
                    toast.warning(`Partner approved, but email failed to send! Invite Link: ${result.inviteUrl}`, {
                        duration: 10000,
                    })
                    // console.log("Invite URL:", result.inviteUrl)
                } else {
                    toast.success("Partner approved! Registration invite has been sent to their email.", {
                        duration: 5000
                    })
                }
                setApplication(prev => prev ? { ...prev, status: 'approved' } : null)
                setShowApproveDialog(false)
            } else {
                toast.error(result.error || "Failed to approve application")
            }
        } catch (err) {
            // console.error('Approval error:', err)
            toast.error("An unexpected error occurred")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleRejectClick = () => {
        setShowRejectDialog(true)
    }

    const handleRejectConfirm = async () => {
        if (!application) return

        setIsProcessing(true)
        try {
            const result = await rejectApplication(application.id)

            if (result.success) {
                if (result.emailSent === false) {
                    toast.warning(`Application rejected, but email failed to send! Error: ${result.emailErrorDetail || 'Unknown error'}`, {
                        duration: 10000
                    })
                } else {
                    toast.success("Application rejected. Notification email has been sent.", {
                        duration: 5000
                    })
                }
                setApplication(prev => prev ? { ...prev, status: 'rejected' } : null)
                setShowRejectDialog(false)
            } else {
                toast.error(result.error || "Failed to reject application")
            }
        } catch (err) {
            // console.error('Rejection error:', err)
            toast.error("An unexpected error occurred")
        } finally {
            setIsProcessing(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
            </div>
        )
    }

    if (error || !application) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl border-3 border-black shadow-hard-lg text-center max-w-md">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Application Not Found</h1>
                    <p className="text-gray-600">{error || 'The review link is invalid or has expired.'}</p>
                </div>
            </div>
        )
    }

    const plan = application.subscription_plan ? PLAN_FEATURES[application.subscription_plan] : null
    const isPending = application.status === 'pending'

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold">Partner Application Review</h1>
                        <span className={`px-3 py-1 text-sm font-bold rounded-full border-2 border-black ${application.status === 'pending' ? 'bg-yellow-300' :
                            application.status === 'approved' ? 'bg-green-300' : 'bg-red-300'
                            }`}>
                            {application.status.toUpperCase()}
                        </span>
                    </div>
                    <p className="text-gray-600 mt-2">Submitted on {new Date(application.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-3 border-black rounded-xl shadow-hard-lg overflow-hidden"
                >
                    {/* Owner Details */}
                    <div className="p-6 border-b-3 border-black">
                        <h2 className="text-lg font-bold uppercase flex items-center gap-2 mb-4">
                            <User className="w-5 h-5" /> Owner Details
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Full Name</p>
                                <p className="text-lg font-medium">{application.owner_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                                <a href={`mailto:${application.email}`} className="text-lg font-medium text-blue-600 hover:underline flex items-center gap-1">
                                    {application.email} <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Phone / WhatsApp</p>
                                <p className="text-lg font-medium">{application.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Venue Details */}
                    <div className="p-6 border-b-3 border-black bg-gray-50">
                        <h2 className="text-lg font-bold uppercase flex items-center gap-2 mb-4">
                            <Building2 className="w-5 h-5" /> Venue Information
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Venue Name</p>
                                <p className="text-lg font-medium">{application.venue_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Address</p>
                                <p className="text-lg font-medium">{application.venue_address}</p>
                            </div>
                            {application.venue_latitude && application.venue_longitude && (
                                <div className="md:col-span-2">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Location</p>
                                    <a
                                        href={`https://www.google.com/maps?q=${application.venue_latitude},${application.venue_longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <MapPin className="w-4 h-4" /> View on Google Maps
                                    </a>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Flooring Material</p>
                                <p className="text-lg font-medium">{application.flooring_material}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Social Media</p>
                                <p className="text-lg font-medium">{application.social_media}</p>
                            </div>
                            {application.website && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Website</p>
                                    <a href={application.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                        {application.website} <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 uppercase font-bold">Routine Clubs</p>
                            <p className="text-base font-medium whitespace-pre-wrap">{application.routine_clubs}</p>
                        </div>
                    </div>

                    {/* Goals & Plan */}
                    <div className="p-6 border-b-3 border-black">
                        <h2 className="text-lg font-bold uppercase flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5" /> Goals & Subscription
                        </h2>
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-2">Selected Goals</p>
                            <div className="flex flex-wrap gap-2">
                                {application.goals.map((goal, i) => (
                                    <span key={i} className="bg-black text-white px-3 py-1 rounded-full text-sm font-bold">
                                        {goal}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {plan && (
                            <div className="bg-pastel-lilac p-4 rounded-lg border-2 border-black shadow-hard-sm">
                                <p className="text-xs text-gray-700 uppercase font-bold">Selected Plan</p>
                                <p className="text-2xl font-bold">{plan.displayName}</p>
                                <p className="text-lg font-medium">Rp {(plan.priceMonthly / 1000).toLocaleString('id-ID')}rb / month</p>
                                <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6 bg-gray-100 flex flex-col sm:flex-row gap-4 justify-center">
                        {isPending ? (
                            <>
                                <button
                                    onClick={handleApproveClick}
                                    disabled={isProcessing}
                                    className="flex-1 sm:flex-none px-8 py-4 bg-pastel-acid text-black font-bold text-lg rounded-xl border-3 border-black shadow-hard-md hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-hard-md disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-6 h-6" />
                                    )}
                                    {isProcessing ? 'Processing...' : 'Partner Approved'}
                                </button>
                                <button
                                    onClick={handleRejectClick}
                                    disabled={isProcessing}
                                    className="flex-1 sm:flex-none px-8 py-4 bg-red-400 text-black font-bold text-lg rounded-xl border-3 border-black shadow-hard-md hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-hard-md disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <XCircle className="w-6 h-6" />
                                    )}
                                    {isProcessing ? 'Processing...' : 'Reject'}
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-lg font-bold text-gray-600">
                                    This application has been {application.status === 'approved' ? (
                                        <span className="text-green-600">approved</span>
                                    ) : (
                                        <span className="text-red-600">rejected</span>
                                    )}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {application.status === 'approved'
                                        ? 'A registration invite has been sent to the partner.'
                                        : 'A notification email has been sent to the applicant.'}
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                isOpen={showApproveDialog}
                onClose={() => setShowApproveDialog(false)}
                onConfirm={handleApproveConfirm}
                isProcessing={isProcessing}
                variant="approve"
                title="Approve Partner"
                ownerName={application?.owner_name || ''}
                venueName={application?.venue_name || ''}
                bulletPoints={[
                    'Generate a registration invite via PWA Smash',
                    'Send an approval email to the partner'
                ]}
            />

            <ConfirmDialog
                isOpen={showRejectDialog}
                onClose={() => setShowRejectDialog(false)}
                onConfirm={handleRejectConfirm}
                isProcessing={isProcessing}
                variant="reject"
                title="Reject Application"
                ownerName={application?.owner_name || ''}
                venueName={application?.venue_name || ''}
                bulletPoints={[
                    'Send a rejection email to the partner',
                    'Mark this application as rejected'
                ]}
            />
        </div>
    )
}

