import { isAdmin, getCurrentUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    Settings,
    LogOut,
    Lock
} from "lucide-react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isUserAdmin = await isAdmin();
    const user = await getCurrentUser();

    if (!isUserAdmin) {
        return (
            <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4 font-sans text-neo-black">
                <div className="bg-white border-3 border-neo-black p-8 max-w-md w-full shadow-hard relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-neo-pink px-4 py-1 border-l-3 border-b-3 border-neo-black font-bold text-xs uppercase transform translate-x-1 -translate-y-1">
                        Security Alert
                    </div>

                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-red-100 border-3 border-neo-black rounded-full text-red-600 shadow-hard-sm">
                            <Lock className="w-10 h-10" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black uppercase mb-2 text-center">Access Denied</h1>
                    <p className="mb-6 font-mono text-center text-gray-600">You do not have permission to view the admin panel.</p>

                    <div className="bg-gray-50 p-4 border-2 border-gray-200 mb-8 font-mono text-xs space-y-2">
                        <p className="font-bold border-b border-gray-200 pb-2 mb-2 uppercase text-gray-400">Debug Information</p>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Current User:</span>
                            <span className="font-bold">{user ? user.email : 'Not Logged In'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Required Email:</span>
                            <span className="font-bold">{process.env.ADMIN_EMAIL || 'Not Set in .env'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Role:</span>
                            <span className="font-bold uppercase">{user?.role || 'Guest'}</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Link href="/" className="flex-1 block text-center py-3 bg-neo-black text-white font-bold border-2 border-neo-black hover:bg-gray-800 transition-all shadow-hard-sm hover:translate-y-1 hover:shadow-none">
                            Back Home
                        </Link>
                        {!user && (
                            <Link href="/admin/login" className="flex-1 block text-center py-3 bg-neo-yellow text-black font-bold border-2 border-neo-black hover:bg-yellow-300 transition-all shadow-hard-sm hover:translate-y-1 hover:shadow-none">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const menuItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/admin" },
        { icon: CalendarDays, label: "Bookings", href: "/admin/bookings" },
        { icon: Users, label: "Users", href: "/admin/users" },
        { icon: Settings, label: "Settings", href: "/admin/settings" },
    ];

    return (
        <div className="min-h-screen bg-neo-bg flex font-sans text-neo-black">
            {/* Sidebar */}
            <aside className="w-64 border-r-3 border-neo-black bg-white p-6 flex flex-col fixed h-full z-10">
                <div className="mb-10">
                    <Link href="/" className="block">
                        <h1 className="text-2xl font-black italic tracking-tighter hover:text-neo-blue transition-colors">
                            SMASH<span className="text-neo-green">.</span>ADMIN
                        </h1>
                    </Link>
                </div>

                <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group flex items-center gap-3 px-4 py-3 font-bold border-2 border-transparent hover:border-neo-black hover:bg-neo-yellow hover:shadow-hard-sm transition-all rounded-none"
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t-3 border-neo-black">
                    <button className="w-full flex items-center gap-3 px-4 py-3 font-bold border-2 border-transparent hover:bg-neo-pink hover:border-neo-black hover:shadow-hard-sm transition-all">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
