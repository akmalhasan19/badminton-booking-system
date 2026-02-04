import { Hand, DollarSign, CalendarCheck, TrendingUp } from "lucide-react";
import { getDashboardStats } from "./actions";

export default async function AdminPage() {
    const stats = await getDashboardStats();

    // Fallback if fetch fails or no data
    const data = {
        totalBookings: stats?.totalBookings || 0,
        revenue: stats?.revenue || 0,
        activeUsers: stats?.activeUsers || 0,
        growth: stats?.growth || "0%",
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-8">
            <header className="mb-8">
                <h1 className="text-4xl font-black uppercase mb-2">Dashboard</h1>
                <p className="font-mono text-gray-600">Welcome back, Admin. Real-time overview of your court.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Bookings", value: data.totalBookings.toString(), icon: CalendarCheck, color: "bg-neo-blue" },
                    { label: "Revenue", value: formatCurrency(data.revenue), icon: DollarSign, color: "bg-neo-green" },
                    { label: "Active Users", value: data.activeUsers.toString(), icon: Hand, color: "bg-neo-pink" },
                    { label: "Growth", value: data.growth, icon: TrendingUp, color: "bg-neo-yellow" },
                ].map((stat) => (
                    <div key={stat.label} className={`p-6 border-3 border-neo-black shadow-hard hover:translate-x-1 hover:-translate-y-1 hover:shadow-hard-lg transition-all bg-white`}>
                        <div className={`w-12 h-12 ${stat.color} border-2 border-neo-black flex items-center justify-center mb-4 shadow-hard-sm`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <p className="font-mono font-bold text-sm text-gray-600 uppercase">{stat.label}</p>
                        <p className="text-3xl font-black mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section (Placeholder) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                <div className="lg:col-span-2 border-3 border-neo-black bg-white p-6 shadow-hard">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black uppercase">Recent Bookings</h2>
                        <button className="px-4 py-2 bg-neo-purple border-2 border-neo-black font-bold text-sm hover:shadow-hard-sm transition-all">
                            View All
                        </button>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 border-2 border-gray-200 hover:border-neo-black hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-bold">Court A - 20:00</span>
                                    <span className="text-sm font-mono text-gray-500">Booked by User #{100 + i}</span>
                                </div>
                                <span className="px-3 py-1 bg-neo-green/20 text-neo-green font-bold border border-neo-green text-xs rounded-full">
                                    CONFIRMED
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-3 border-neo-black bg-neo-yellow p-6 shadow-hard">
                    <h2 className="text-2xl font-black uppercase mb-6">Quick Actions</h2>
                    <div className="space-y-3">
                        <button className="w-full py-3 bg-white border-2 border-neo-black font-bold shadow-hard-sm hover:translate-x-1 hover:-translate-y-1 hover:shadow-hard transition-all">
                            Add New Booking
                        </button>
                        <button className="w-full py-3 bg-white border-2 border-neo-black font-bold shadow-hard-sm hover:translate-x-1 hover:-translate-y-1 hover:shadow-hard transition-all">
                            Manage Courts
                        </button>
                        <button className="w-full py-3 bg-white border-2 border-neo-black font-bold shadow-hard-sm hover:translate-x-1 hover:-translate-y-1 hover:shadow-hard transition-all">
                            Update Pricing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
