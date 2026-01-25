"use client"

import { useState } from "react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { SchedulingCalendar } from "@/components/SchedulingCalendar"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"

// Mock Data for MVP
const COURTS = [
    { id: 1, name: "Lapangan 1 (Vinyl)", price: 80000, color: "bg-blue-500", type: "Vinyl Pro" },
    { id: 2, name: "Lapangan 2 (Vinyl)", price: 80000, color: "bg-emerald-500", type: "Vinyl Pro" },
    { id: 3, name: "Lapangan 3 (Parquet)", price: 90000, color: "bg-orange-500", type: "Teak Wood" },
]

const TIME_SLOTS = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
    "20:00", "21:00", "22:00", "23:00"
]

export default function BookingPage() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [selectedCourt, setSelectedCourt] = useState<number | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    const handleBooking = () => {
        alert("Fitur Booking akan segera hadir! (MVP Demo)")
    }

    return (
        <main className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
            <Navbar />

            <div className="pt-24 pb-12 px-6 md:px-12 max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">
                        Reservasi Jadwal
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Pilih tanggal, lapangan favorit, dan waktu bermain Anda. Kami siapkan sisanya.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Date & Court Selection */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Step 1: Date */}
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-sm font-bold text-white">1</span>
                                Pilih Tanggal Main
                            </h2>
                            <div className="flex justify-center md:justify-start w-full">
                                <SchedulingCalendar
                                    selectedDate={date}
                                    onSelectDate={setDate}
                                    className="border-none shadow-none"
                                />
                            </div>
                        </section>

                        {/* Step 2: Court */}
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-sm font-bold text-white">2</span>
                                Pilih Lapangan
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {COURTS.map((court) => (
                                    <div
                                        key={court.id}
                                        onClick={() => setSelectedCourt(court.id)}
                                        className={cn(
                                            "cursor-pointer group relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300",
                                            selectedCourt === court.id
                                                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                                : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                                        )}
                                    >
                                        <div className={cn("absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity", court.color)}>
                                            <div className="w-16 h-16 rounded-full blur-xl bg-current"></div>
                                        </div>

                                        <h3 className="font-bold text-primary mb-1">{court.name}</h3>
                                        <p className="text-xs text-muted-foreground mb-4">{court.type}</p>
                                        <p className="font-medium text-emerald-400">Rp {court.price.toLocaleString("id-ID")}/jam</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Step 3: Time */}
                        {date && selectedCourt && (
                            <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-sm font-bold text-white">3</span>
                                    Pilih Jam
                                </h2>
                                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                                    {TIME_SLOTS.map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={cn(
                                                "py-2 px-1 text-sm rounded-lg border transition-all duration-200",
                                                selectedTime === time
                                                    ? "bg-primary text-primary-foreground border-primary shadow-md transform scale-105"
                                                    : "bg-white text-zinc-600 border-zinc-200 hover:border-primary hover:text-primary"
                                            )}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>

                    {/* Right Column: Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-zinc-200">
                                <h2 className="text-lg font-bold text-primary mb-6">Ringkasan Pemesanan</h2>

                                <div className="space-y-4 mb-6 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tanggal</span>
                                        <span className="font-medium text-right">
                                            {date ? format(date, "EEEE, dd MMMM yyyy", { locale: id }) : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Lapangan</span>
                                        <span className="font-medium text-right">
                                            {selectedCourt ? COURTS.find(c => c.id === selectedCourt)?.name : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Jam Mulai</span>
                                        <span className="font-medium text-right">{selectedTime || "-"}</span>
                                    </div>
                                    <div className="flex justify-between pt-4 border-t border-dashed border-zinc-700 text-base font-bold text-primary">
                                        <span>Total</span>
                                        <span>
                                            {selectedCourt && selectedTime
                                                ? `Rp ${COURTS.find(c => c.id === selectedCourt)?.price.toLocaleString("id-ID")}`
                                                : "Rp 0"}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleBooking}
                                    className="w-full h-12 text-base font-semibold"
                                    disabled={!date || !selectedCourt || !selectedTime}
                                >
                                    Konfirmasi Booking
                                </Button>

                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    Pembayaran dilakukan setelah konfirmasi.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <Footer />
        </main>
    )
}
