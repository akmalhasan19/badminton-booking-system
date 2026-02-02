"use client"

import { PageHeader } from "@/components/PageHeader"
import { NeoToggle } from "@/components/NeoToggle"
import { Info } from "lucide-react"
import { useState } from "react"

export default function NotificationSettingsPage() {
    const [settings, setSettings] = useState({
        accountEmail: true,
        accountPush: false,
        exclusiveEmail: true,
        exclusivePush: false,
        reminderEmail: true,
        reminderPush: false,
    })

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <main className="min-h-screen bg-white pt-24 pb-12">
            <div className="max-w-2xl mx-auto px-4">
                <PageHeader
                    title="Pengaturan Notifikasi"
                    showBack={true}
                />

                <div className="space-y-8">
                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-700">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">
                            Push notification tidak aktif. Kamu perlu mengaktifkan notifikasi di browser-mu dulu.
                        </p>
                    </div>

                    {/* Aktivitas Akun */}
                    <section>
                        <h3 className="font-bold text-lg mb-2">Aktivitas Akun</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Pantau aktivitas login dan OTP untuk memastikan akunmu aman.
                        </p>
                        <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-hard divide-y-2 divide-gray-100">
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="font-bold">Email</span>
                                <NeoToggle active={settings.accountEmail} onToggle={() => toggle('accountEmail')} />
                            </div>
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="font-bold">Push Notification</span>
                                <NeoToggle active={settings.accountPush} onToggle={() => toggle('accountPush')} />
                            </div>
                        </div>
                    </section>

                    {/* Info Eksklusif */}
                    <section>
                        <h3 className="font-bold text-lg mb-2">Info Eksklusif</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Jadi yang pertama dapetin info diskon terbatas, penawaran khusus, dan fitur baru.
                        </p>
                        <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-hard divide-y-2 divide-gray-100">
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="font-bold">Email</span>
                                <NeoToggle active={settings.exclusiveEmail} onToggle={() => toggle('exclusiveEmail')} />
                            </div>
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="font-bold">Push Notification</span>
                                <NeoToggle active={settings.exclusivePush} onToggle={() => toggle('exclusivePush')} />
                            </div>
                        </div>
                    </section>

                    {/* Pengingat */}
                    <section>
                        <h3 className="font-bold text-lg mb-2">Pengingat</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Dapetin pengingat pembayaran, check-in, harga turun di Wishlist, dan lainnya.
                        </p>
                        <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-hard divide-y-2 divide-gray-100">
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="font-bold">Email</span>
                                <NeoToggle active={settings.reminderEmail} onToggle={() => toggle('reminderEmail')} />
                            </div>
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="font-bold">Push Notification</span>
                                <NeoToggle active={settings.reminderPush} onToggle={() => toggle('reminderPush')} />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
