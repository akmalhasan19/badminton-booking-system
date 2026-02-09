"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface CreateMatchPageClientProps {
    communityId: string | null
    communityName: string
    communityImageUrl?: string | null
    mode: string
}

type SkillPreference = "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
type MatchFormat = "SINGLE" | "DOUBLE" | "MIXED"

export default function CreateMatchPageClient({
    communityId,
    communityName,
    communityImageUrl,
    mode
}: CreateMatchPageClientProps) {
    const router = useRouter()
    const [participants, setParticipants] = useState(4)
    const [hostCounts, setHostCounts] = useState(true)
    const [coachingSession, setCoachingSession] = useState(false)
    const [skillPreference, setSkillPreference] = useState<SkillPreference>("ALL")
    const [fee, setFee] = useState<number>(0)
    const [isPublic, setIsPublic] = useState(true)
    const [matchFormat, setMatchFormat] = useState<MatchFormat>("DOUBLE")

    const modeConfig = useMemo(() => {
        const normalized = mode.toUpperCase()
        if (normalized === "SPARRING") {
            return {
                title: "Sparring",
                subtitle: "Tantangan",
                headerClass: "bg-secondary text-white",
                badgeClass: "bg-secondary text-white"
            }
        }
        if (normalized === "RANKED") {
            return {
                title: "Turnamen",
                subtitle: "Kompetisi",
                headerClass: "bg-pastel-yellow text-black",
                badgeClass: "bg-black text-white"
            }
        }
        return {
            title: "Main Bareng",
            subtitle: "Main Bareng",
            headerClass: "bg-primary text-black",
            badgeClass: "bg-black text-white"
        }
    }, [mode])

    const incrementParticipants = () => setParticipants((prev) => Math.min(prev + 1, 16))
    const decrementParticipants = () => setParticipants((prev) => Math.max(prev - 1, 2))

    return (
        <div className="bg-background-light dark:bg-background-dark font-body text-black dark:text-white min-h-screen pb-28">
            <header className={cn(
                "sticky top-0 z-50 border-b-4 border-black dark:border-white border-l-0 border-r-0 border-t-0 px-4 py-4 flex items-center justify-between",
                modeConfig.headerClass
            )}>
                <button
                    onClick={() => router.back()}
                    className="flex items-center justify-center p-2 bg-white dark:bg-surface-dark border-2 border-black dark:border-white shadow-hard-sm rounded-md active:translate-y-0.5 active:shadow-none transition-all"
                    aria-label="Back"
                >
                    <span className="material-icons-round text-black dark:text-white">arrow_back</span>
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="font-display font-bold text-xl uppercase tracking-wider">Create Activity</h1>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded", modeConfig.badgeClass)}>
                        {modeConfig.subtitle}
                    </span>
                </div>
                <div className="w-10" />
            </header>

            <main className="p-5 space-y-6 max-w-md mx-auto">
                <section className="space-y-4">
                    <div className="group relative">
                        <label className="block font-display font-bold text-sm mb-1 uppercase tracking-wide">Activity Name</label>
                        <input
                            className="w-full bg-surface-light dark:bg-surface-dark border-2 border-black dark:border-white rounded-lg px-4 py-3 font-bold placeholder-gray-400 focus:ring-0 shadow-hard focus:translate-y-0.5 focus:shadow-hard-sm transition-all dark:text-white dark:placeholder-gray-500"
                            placeholder="contoh: Main Bareng Mingguan"
                            type="text"
                        />
                    </div>
                    <div className="group relative">
                        <label className="block font-display font-bold text-sm mb-1 uppercase tracking-wide">Deskripsi</label>
                        <textarea
                            className="w-full bg-surface-light dark:bg-surface-dark border-2 border-black dark:border-white rounded-lg px-4 py-3 font-medium placeholder-gray-400 focus:ring-0 shadow-hard focus:translate-y-0.5 focus:shadow-hard-sm transition-all dark:text-white dark:placeholder-gray-500 resize-none"
                            placeholder="Tulis gaya main, aturan, atau info penting lainnya."
                            rows={3}
                        />
                    </div>
                </section>

                <hr className="border-2 border-black dark:border-white border-dashed opacity-20" />

                <section className="grid gap-4">
                    <div className="bg-surface-light dark:bg-surface-dark border-2 border-black dark:border-white rounded-xl p-4 shadow-hard">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-accent w-10 h-10 rounded-md border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="material-icons-round text-black">sports_tennis</span>
                                </div>
                                <div>
                                    <p className="font-display font-bold text-xs uppercase text-gray-500 dark:text-gray-400">Format Main</p>
                                    <p className="font-bold text-lg leading-tight">
                                        {matchFormat === "SINGLE"
                                            ? "1 vs 1"
                                            : matchFormat === "DOUBLE"
                                                ? "2 vs 2"
                                                : "Campuran"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {(["SINGLE", "DOUBLE", "MIXED"] as MatchFormat[]).map((format) => (
                                <button
                                    key={format}
                                    type="button"
                                    onClick={() => setMatchFormat(format)}
                                    className={cn(
                                        "px-3 py-2 text-xs font-black uppercase border-2 rounded-lg transition-all",
                                        matchFormat === format
                                            ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                            : "bg-white dark:bg-surface-dark text-black dark:text-white border-black dark:border-white"
                                    )}
                                >
                                    {format === "SINGLE" ? "1 vs 1" : format === "DOUBLE" ? "2 vs 2" : "Campuran"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark border-2 border-black dark:border-white rounded-xl p-4 shadow-hard flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-secondary w-10 h-10 rounded-md border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                {communityImageUrl ? (
                                    <img
                                        src={communityImageUrl}
                                        alt={communityName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="material-icons-round text-white">groups</span>
                                )}
                            </div>
                            <div>
                                <p className="font-display font-bold text-xs uppercase text-gray-500 dark:text-gray-400">Komunitas</p>
                                <p className="font-bold text-lg leading-tight">{communityName}</p>
                                {communityId && (
                                    <p className="text-[10px] text-gray-400 font-mono">
                                        Admin komunitas ini sedang membuat activity.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4">
                    <div className="bg-surface-light dark:bg-surface-dark border-2 border-black dark:border-white rounded-xl p-4 shadow-hard">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white dark:bg-gray-700 w-10 h-10 rounded-md border-2 border-black dark:border-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                                    <span className="material-icons-round">calendar_month</span>
                                </div>
                                <p className="font-bold text-lg leading-tight">Tanggal & Waktu</p>
                            </div>
                            <span className="material-icons-round text-2xl">chevron_right</span>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <input
                                type="date"
                                className="w-full bg-white dark:bg-surface-dark border-2 border-black dark:border-white rounded-lg px-2 py-2 text-xs font-bold"
                                defaultValue={new Date().toISOString().split("T")[0]}
                            />
                            <input
                                type="time"
                                className="w-full bg-white dark:bg-surface-dark border-2 border-black dark:border-white rounded-lg px-2 py-2 text-xs font-bold"
                                defaultValue="18:00"
                            />
                            <input
                                type="time"
                                className="w-full bg-white dark:bg-surface-dark border-2 border-black dark:border-white rounded-lg px-2 py-2 text-xs font-bold"
                                defaultValue="20:00"
                            />
                        </div>
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark border-2 border-black dark:border-white rounded-xl p-4 shadow-hard">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white dark:bg-gray-700 w-10 h-10 rounded-md border-2 border-black dark:border-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                                    <span className="material-icons-round">location_on</span>
                                </div>
                                <p className="font-bold text-lg leading-tight">Lokasi</p>
                            </div>
                            <span className="material-icons-round text-2xl">chevron_right</span>
                        </div>
                        <div className="mt-4 space-y-2">
                            <input
                                type="text"
                                className="w-full bg-white dark:bg-surface-dark border-2 border-black dark:border-white rounded-lg px-3 py-2 text-xs font-bold"
                                placeholder="Nama GOR / Venue"
                            />
                            <input
                                type="text"
                                className="w-full bg-white dark:bg-surface-dark border-2 border-black dark:border-white rounded-lg px-3 py-2 text-xs font-medium"
                                placeholder="Alamat (opsional)"
                            />
                        </div>
                    </div>
                </section>

                <section className="bg-secondary bg-opacity-10 dark:bg-opacity-20 border-2 border-black dark:border-white border-dashed rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-secondary w-8 h-8 rounded border-2 border-black flex items-center justify-center">
                            <span className="material-icons-round text-white text-sm">school</span>
                        </div>
                        <span className="font-display font-bold uppercase tracking-tight">Sesi Coaching</span>
                        <span className="material-icons-round text-gray-500 text-sm cursor-help">info</span>
                    </div>
                    <div className="relative inline-block w-12 h-7 align-middle select-none transition duration-200 ease-in">
                        <input
                            checked={coachingSession}
                            onChange={(event) => setCoachingSession(event.target.checked)}
                            className="peer toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-2 border-black appearance-none cursor-pointer translate-x-0.5 top-0.5 checked:translate-x-5 transition-transform duration-200 z-10"
                            id="coaching-toggle"
                            type="checkbox"
                        />
                        <label
                            htmlFor="coaching-toggle"
                            className="toggle-label block overflow-hidden h-7 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-black dark:border-white cursor-pointer peer-checked:bg-secondary"
                        />
                    </div>
                </section>

                <section className="bg-surface-light dark:bg-surface-dark border-2 border-black dark:border-white rounded-xl p-5 shadow-hard space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-2xl">group</span>
                            <span className="font-display font-bold text-lg uppercase">Peserta</span>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border-2 border-black dark:border-gray-600">
                            <button
                                type="button"
                                onClick={decrementParticipants}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-surface-dark rounded border-2 border-black dark:border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px] transition-all"
                            >
                                <span className="material-icons-round text-sm font-bold">remove</span>
                            </button>
                            <span className="font-display font-bold text-xl w-6 text-center">{participants}</span>
                            <button
                                type="button"
                                onClick={incrementParticipants}
                                className="w-8 h-8 flex items-center justify-center bg-accent rounded border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px] transition-all"
                            >
                                <span className="material-icons-round text-sm font-bold text-black">add</span>
                            </button>
                        </div>
                    </div>
                    <label className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-primary rounded-lg cursor-pointer">
                        <input
                            checked={hostCounts}
                            onChange={(event) => setHostCounts(event.target.checked)}
                            className="w-6 h-6 border-2 border-black rounded text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            type="checkbox"
                        />
                        <span className="font-bold text-sm leading-tight">Host dihitung sebagai peserta</span>
                    </label>
                </section>

                <section className="bg-surface-light dark:bg-surface-dark border-2 border-black dark:border-white rounded-xl p-4 shadow-hard">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white dark:bg-gray-700 w-10 h-10 rounded-md border-2 border-black dark:border-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                                <span className="material-icons-round">graphic_eq</span>
                            </div>
                            <p className="font-bold text-lg leading-tight">Preferensi Level</p>
                        </div>
                        <span className="material-icons-round text-2xl">chevron_right</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {(["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as SkillPreference[]).map((level) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => setSkillPreference(level)}
                                className={cn(
                                    "px-3 py-2 text-xs font-black uppercase border-2 rounded-lg transition-all",
                                    skillPreference === level
                                        ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        : "bg-white dark:bg-surface-dark text-black dark:text-white border-black dark:border-white"
                                )}
                            >
                                {level === "ALL" ? "Semua Level" : level}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="space-y-3 pt-2">
                    <div className="bg-white dark:bg-surface-dark border-2 border-black dark:border-white p-3 rounded-lg flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="font-bold flex items-center gap-2">
                                <span className="material-icons-round text-sm border border-black dark:border-white rounded p-0.5">payments</span>
                                Biaya
                            </span>
                            <span className="material-icons-round">chevron_right</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min={0}
                                value={fee}
                                onChange={(event) => setFee(Number(event.target.value || 0))}
                                className="flex-1 bg-background-light dark:bg-background-dark border-2 border-black dark:border-white rounded-lg px-3 py-2 text-xs font-bold"
                                placeholder="0"
                            />
                            <span className="text-xs font-bold text-gray-500">IDR / orang</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-surface-dark border-2 border-black dark:border-white p-3 rounded-lg flex justify-between items-center">
                        <span className="font-bold flex items-center gap-2">
                            <span className="material-icons-round text-sm border border-black dark:border-white rounded p-0.5">lock</span>
                            Privasi
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsPublic(true)}
                                className={cn(
                                    "px-2 py-1 text-[10px] font-black uppercase border-2 rounded",
                                    isPublic ? "bg-black text-white border-black" : "bg-white text-black border-black"
                                )}
                            >
                                Publik
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsPublic(false)}
                                className={cn(
                                    "px-2 py-1 text-[10px] font-black uppercase border-2 rounded",
                                    !isPublic ? "bg-black text-white border-black" : "bg-white text-black border-black"
                                )}
                            >
                                Privat
                            </button>
                        </div>
                    </div>
                </section>

                <div className="pt-4 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <span className="material-icons-round animate-spin-slow">settings</span>
                    <span className="font-display font-bold uppercase tracking-wide text-sm">Pengaturan Lanjutan</span>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-5 bg-background-light dark:bg-background-dark border-t-2 border-black dark:border-white z-40">
                <div className="max-w-md mx-auto">
                    <button
                        type="button"
                        className="w-full bg-primary text-black font-display font-bold text-lg uppercase tracking-wider py-4 rounded-xl border-2 border-black shadow-hard active:shadow-none active:translate-y-1 transition-all"
                    >
                        Konfirmasi &amp; Buat Aktivitas
                    </button>
                </div>
            </div>
        </div>
    )
}
