"use client"

import { PageHeader } from "@/components/PageHeader"
import { NeoToggle } from "@/components/NeoToggle"
import { getNotificationPreferences, NotificationPreferences, updateNotificationPreferences } from "@/lib/api/actions"
import { Info, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function NotificationSettingsPage() {
    const [settings, setSettings] = useState<NotificationPreferences>({
        accountEmail: true,
        accountPush: false,
        exclusiveEmail: true,
        exclusivePush: false,
        reminderEmail: true,
        reminderPush: false,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [savingKey, setSavingKey] = useState<keyof NotificationPreferences | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        const loadPreferences = async () => {
            setIsLoading(true)
            setErrorMessage(null)

            try {
                const data = await getNotificationPreferences()
                setSettings(data)
            } catch (error) {
                console.error('Failed to load notification settings:', error)
                setErrorMessage('Gagal memuat pengaturan notifikasi.')
            } finally {
                setIsLoading(false)
            }
        }

        loadPreferences()
    }, [])

    const toggle = async (key: keyof NotificationPreferences) => {
        const previousValue = settings[key]
        const nextValue = !previousValue

        setSettings(prev => ({ ...prev, [key]: nextValue }))
        setSavingKey(key)
        setErrorMessage(null)

        try {
            const result = await updateNotificationPreferences({ [key]: nextValue })
            if (!result.success) {
                setSettings(prev => ({ ...prev, [key]: previousValue }))
                setErrorMessage(result.error || 'Gagal menyimpan pengaturan.')
            }
        } catch (error) {
            console.error('Failed to update notification setting:', error)
            setSettings(prev => ({ ...prev, [key]: previousValue }))
            setErrorMessage('Gagal menyimpan pengaturan.')
        } finally {
            setSavingKey(null)
        }
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
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-medium">
                            {errorMessage}
                        </div>
                    )}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Memuat preferensi notifikasi...
                        </div>
                    )}

                    {/* Aktivitas Akun */}
                    <section>
                        <h3 className="font-bold text-lg mb-2">Aktivitas Akun</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Pantau aktivitas login dan OTP untuk memastikan akunmu aman.
                        </p>
                        <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-hard divide-y-2 divide-gray-100">
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="font-bold">Email</span>
                                <NeoToggle active={settings.accountEmail} onToggle={() => toggle('accountEmail')} disabled={isLoading || savingKey === 'accountEmail'} />
                            </div>
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="font-bold">Push Notification</span>
                                <NeoToggle active={settings.accountPush} onToggle={() => toggle('accountPush')} disabled={isLoading || savingKey === 'accountPush'} />
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
                                <NeoToggle active={settings.exclusiveEmail} onToggle={() => toggle('exclusiveEmail')} disabled={isLoading || savingKey === 'exclusiveEmail'} />
                            </div>
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="font-bold">Push Notification</span>
                                <NeoToggle active={settings.exclusivePush} onToggle={() => toggle('exclusivePush')} disabled={isLoading || savingKey === 'exclusivePush'} />
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
                                <NeoToggle active={settings.reminderEmail} onToggle={() => toggle('reminderEmail')} disabled={isLoading || savingKey === 'reminderEmail'} />
                            </div>
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="font-bold">Push Notification</span>
                                <NeoToggle active={settings.reminderPush} onToggle={() => toggle('reminderPush')} disabled={isLoading || savingKey === 'reminderPush'} />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
