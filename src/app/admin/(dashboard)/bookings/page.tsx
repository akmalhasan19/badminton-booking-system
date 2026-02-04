import { getAllBookings } from "./actions";
import { BookingTable } from "./booking-table";

export default async function AdminBookingsPage() {
    const { data: bookings, error } = await getAllBookings();

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
                    TOTAL: {bookings?.length || 0}
                </div>
            </div>

            <BookingTable bookings={bookings || []} />
        </div>
    );
}
