import { getReports, resolveReport } from "@/app/reports/actions"
import { ReportsClient } from "./ReportsClient"

export default async function AdminReportsPage() {
    const { data: reports } = await getReports({ status: 'pending' })

    return (
        <main className="min-h-screen bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Reports Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage user-submitted reports</p>
                </div>

                <ReportsClient initialReports={reports || []} />
            </div>
        </main>
    )
}
