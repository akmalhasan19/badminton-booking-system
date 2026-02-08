import { getAllBookings } from "./actions";
import { BookingTable } from "./booking-table";
import { Pagination } from "./pagination";

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ page?: string, type?: string }> }) {
    const { page, type } = await searchParams
    const currentPage = Number(page) || 1
    const limit = 10
    const filterType = (type === 'failed' ? 'failed' : 'success') as 'success' | 'failed'

    const { data: bookings, totalCount, error } = await getAllBookings(currentPage, limit, filterType)
    const totalPages = Math.ceil((totalCount || 0) / limit)

    if (error) {
        return <div className="p-4 text-red-500 font-bold bg-white border-2 border-neo-black">Error: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase">Bookings Management</h1>
                    <p className="font-mono text-gray-600">View and manage all court reservations.</p>
                </div>
                <div className="font-mono text-sm bg-neo-yellow px-3 py-1 border-2 border-neo-black font-bold shadow-hard-sm">
                    TOTAL: {totalCount || 0}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b-2 border-gray-100 pb-1">
                <a
                    href="?type=success"
                    className={`px-4 py-2 font-black uppercase text-sm border-b-4 transition-all ${filterType === 'success'
                        ? 'border-neo-green text-neo-black'
                        : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                        }`}
                >
                    Confirmed / Success
                </a>
                <a
                    href="?type=failed"
                    className={`px-4 py-2 font-black uppercase text-sm border-b-4 transition-all ${filterType === 'failed'
                        ? 'border-red-500 text-neo-black'
                        : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                        }`}
                >
                    Failed / Others
                </a>
            </div>

            <BookingTable bookings={bookings || []} />
            <Pagination totalPages={totalPages} />
        </div>
    );
}
