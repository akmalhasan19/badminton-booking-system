import { getAllBookings } from "./actions";
import { BookingTable } from "./booking-table";
import { Pagination } from "./pagination";

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { page } = await searchParams
    const currentPage = Number(page) || 1
    const limit = 10
    const { data: bookings, totalCount, error } = await getAllBookings(currentPage, limit)
    const totalPages = Math.ceil((totalCount || 0) / limit)

    if (error) {
        return <div className="p-4 text-red-500 font-bold bg-white border-2 border-neo-black">Error: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase">Bookings Management</h1>
                    <p className="font-mono text-gray-600">View and manage all court reservations.</p>
                </div>
                <div className="font-mono text-sm bg-neo-yellow px-3 py-1 border-2 border-neo-black font-bold shadow-hard-sm">
                    TOTAL: {totalCount || 0}
                </div>
            </div>

            <BookingTable bookings={bookings || []} />
            <Pagination totalPages={totalPages} />
        </div>
    );
}
