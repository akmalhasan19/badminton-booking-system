'use client'

import { useState, useEffect } from 'react'
import { getPendingBookings, simulateWebhookTrigger, testCreateInvoice } from './actions'
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, Zap } from 'lucide-react'

export default function DebugPage() {
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // New state for API test
    const [testingApi, setTestingApi] = useState(false)
    const [apiTestResult, setApiTestResult] = useState<any>(null)

    const loadData = async () => {
        setLoading(true)
        try {
            const { data, error } = await getPendingBookings()
            if (data) setBookings(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleTestInvoice = async () => {
        setTestingApi(true)
        setApiTestResult(null)
        try {
            const res = await testCreateInvoice()
            setApiTestResult(res)
        } catch (err) {
            setApiTestResult({ success: false, error: 'Client side error' })
        } finally {
            setTestingApi(false)
        }
    }

    const handleSimulate = async (bookingId: string) => {
        setProcessing(bookingId)
        setMessage(null)
        try {
            const res = await simulateWebhookTrigger(bookingId)
            if (res.success) {
                setMessage({ type: 'success', text: `Success! Webhook triggered for ${bookingId}` })
                // Refresh list
                loadData()
            } else {
                setMessage({ type: 'error', text: `Failed: ${res.error}` })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Unknown error occurred' })
        } finally {
            setProcessing(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Debug: Pending Bookings</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={handleTestInvoice}
                            disabled={testingApi}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            {testingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Test Xendit API
                        </button>
                        <button
                            onClick={loadData}
                            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-100"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* API Test Result Section */}
                {apiTestResult && (
                    <div className={`p-4 mb-6 rounded-lg border ${apiTestResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="font-bold mb-2 flex items-center gap-2">
                            {apiTestResult.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                            {apiTestResult.success ? 'Xendit API Connection Successful' : 'Xendit API Failed'}
                        </div>
                        <pre className="text-xs overflow-auto p-2 bg-white/50 rounded max-h-40">
                            {JSON.stringify(apiTestResult, null, 2)}
                        </pre>
                        {apiTestResult.success && (
                            <div className="mt-2 text-sm text-green-700">
                                Invoice created! Check Xendit Dashboard {'>'} Payment Links.
                            </div>
                        )}
                    </div>
                )}

                {message && (
                    <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-bold text-sm">ID / Time</th>
                                <th className="p-4 font-bold text-sm">Court</th>
                                <th className="p-4 font-bold text-sm">User</th>
                                <th className="p-4 font-bold text-sm">Amount</th>
                                <th className="p-4 font-bold text-sm">Status</th>
                                <th className="p-4 font-bold text-sm">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {bookings.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No bookings found (checked last 20).
                                    </td>
                                </tr>
                            )}
                            {bookings.map(booking => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-mono text-xs font-bold">{booking.id}</div>
                                        <div className="text-xs text-gray-500">{new Date(booking.created_at).toLocaleString()}</div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {booking.courts?.name}
                                        <div className="text-xs text-gray-500">{booking.booking_date}</div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="font-bold">{booking.users?.name}</div>
                                        <div className="text-xs text-gray-500">{booking.users?.email}</div>
                                    </td>
                                    <td className="p-4 text-sm font-mono">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(booking.total_price)}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleSimulate(booking.id)}
                                            disabled={!!processing}
                                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {processing === booking.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-3 h-3" />
                                            )}
                                            Simulate Pay
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                        <strong>Note:</strong> This page is for debugging only. It simulates a webhook event from Xendit.
                        Clicking "Simulate Pay" will verify the token from <code>.env.local</code> and update the booking status to <code>confirmed</code>.
                    </div>
                </div>
            </div>
        </div>
    )
}
