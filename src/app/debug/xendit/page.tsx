'use client'

import { useState, useEffect } from 'react'
import { getWebhookLogs, verifyPaymentExternal, simulateWebhookTrigger } from '@/app/debug/actions'

export default function XenditDebugPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [manualId, setManualId] = useState('')
    const [verifyResult, setVerifyResult] = useState<any>(null)
    const [verifying, setVerifying] = useState(false)

    const fetchLogs = async () => {
        setLoading(true)
        const { data, error } = await getWebhookLogs(50)
        if (data) {
            setLogs(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const handleVerify = async () => {
        if (!manualId) return
        setVerifying(true)
        setVerifyResult(null)
        const result = await verifyPaymentExternal(manualId)
        setVerifyResult(result)
        setVerifying(false)
        fetchLogs() // Refresh logs as verify might trigger a sync
    }

    const handleSimulate = async (bookingId: string) => {
        if (!confirm(`Simulate PAID webhook for ${bookingId}?`)) return
        await simulateWebhookTrigger(bookingId)
        alert('Simulation sent. Check logs.')
        fetchLogs()
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Xendit Integration Check</h1>

            {/* Manual Verification Tool */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Manual Payment Check</h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Booking ID (External ID)"
                        className="border p-2 rounded flex-1"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                    />
                    <button
                        onClick={handleVerify}
                        disabled={verifying}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {verifying ? 'Checking...' : 'Check Status & Sync'}
                    </button>
                </div>
                {verifyResult && (
                    <div className={`mt-4 p-4 rounded ${verifyResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        <h3 className="font-bold">{verifyResult.success ? 'Success' : 'Error'}</h3>
                        <p>{verifyResult.message || verifyResult.error}</p>
                        {verifyResult.invoice && (
                            <pre className="mt-2 text-xs overflow-auto bg-gray-100 p-2 rounded">
                                {JSON.stringify(verifyResult.invoice, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>

            {/* Webhook Logs */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Incoming Webhook Logs</h2>
                    <button onClick={fetchLogs} className="text-sm text-blue-600 hover:underline">Refresh</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3">Time</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Source</th>
                                <th className="p-3">Payload Summary</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="p-4 text-center">Loading logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-gray-500">No logs found yet.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <LogRow key={log.id} log={log} onSimulate={handleSimulate} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function LogRow({ log, onSimulate }: { log: any, onSimulate: (id: string) => void }) {
    const [expanded, setExpanded] = useState(false)
    const payload = log.payload || {}
    const isError = log.status === 'failed' || log.status === 'unauthorized'
    const isWarning = log.status === 'warning'

    return (
        <>
            <tr className={`border-b hover:bg-gray-50 ${isError ? 'bg-red-50' : ''} ${isWarning ? 'bg-yellow-50' : ''}`}>
                <td className="p-3 whitespace-nowrap text-gray-600">
                    {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${log.status === 'processed' ? 'bg-green-100 text-green-800' :
                            log.status === 'failed' ? 'bg-red-100 text-red-800' :
                                log.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'}`}>
                        {log.status}
                    </span>
                    {log.response_code && <span className="ml-2 text-gray-400 text-xs">({log.response_code})</span>}
                </td>
                <td className="p-3">{log.source}</td>
                <td className="p-3 font-mono text-xs">
                    <div>ID: {payload.external_id || 'N/A'}</div>
                    <div className="text-gray-500">{payload.status} • {payload.paid_amount ? `Rp ${payload.paid_amount}` : ''}</div>
                    {log.error_message && <div className="text-red-600 font-bold mt-1">{log.error_message}</div>}
                </td>
                <td className="p-3">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-blue-600 hover:underline mr-3"
                    >
                        {expanded ? 'Hide JSON' : 'View JSON'}
                    </button>
                    {payload.external_id && (
                        <button
                            onClick={() => onSimulate(payload.external_id)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Re-simulate this webhook"
                        >
                            🔄 Replay
                        </button>
                    )}
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan={5} className="p-0">
                        <div className="bg-gray-900 text-gray-100 p-4 font-mono text-xs overflow-auto max-h-96">
                            <pre>{JSON.stringify(payload, null, 2)}</pre>
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}
