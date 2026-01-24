"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday
} from "date-fns"
import { id } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

export interface SchedulingCalendarProps {
    className?: string
    selectedDate?: Date
    onSelectDate?: (date: Date) => void
}

export function SchedulingCalendar({
    className,
    selectedDate,
    onSelectDate,
}: SchedulingCalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date())

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    // Generate grid days
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { locale: id })
    const endDate = endOfWeek(monthEnd, { locale: id })

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    })

    const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

    return (
        <div className={cn("w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden ring-1 ring-slate-100", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Bulan Ini</span>
                    <h2 className="text-3xl font-serif font-bold text-slate-900">
                        {format(currentMonth, "MMMM yyyy", { locale: id })}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-full w-9 h-9 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-full w-9 h-9 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Grid Header (Days) - High Contrast */}
            <div className="grid grid-cols-7 bg-slate-900 text-white border-b border-slate-900">
                {weekDays.map((day) => (
                    <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-widest opacity-90">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 auto-rows-[120px] md:auto-rows-[140px] bg-slate-200 gap-px border-b border-l border-slate-200">
                {calendarDays.map((day, dayIdx) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isDayToday = isToday(day)

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onSelectDate?.(day)}
                            className={cn(
                                "relative bg-white p-3 transition-all duration-200 cursor-pointer group hover:z-10",
                                !isCurrentMonth && "bg-slate-50/80 text-gray-300",
                                isSelected && "bg-blue-50/50 shadow-inner",
                                "hover:bg-blue-50/30"
                            )}
                        >
                            {/* Visual Selection Marker */}
                            {isSelected && <div className="absolute inset-0 border-2 border-blue-500 z-20 pointer-events-none" />}

                            {/* Day Number */}
                            <div className="flex items-center justify-between pointer-events-none relative z-10">
                                <span className={cn(
                                    "text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all",
                                    isDayToday
                                        ? "bg-rose-500 text-white shadow-md shadow-rose-200 scale-110"
                                        : isSelected
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                            : "text-slate-700 group-hover:bg-slate-100",
                                    !isCurrentMonth && "text-slate-300 bg-transparent group-hover:bg-transparent"
                                )}>
                                    {format(day, "d")}
                                </span>
                            </div>

                            {/* Add Event Overlay (On Hover) */}
                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <Plus className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Mock Events (Randomly show for demo) */}
                            {isCurrentMonth && Math.random() > 0.85 && (
                                <div className="mt-3 space-y-1 pointe-events-none relative z-10">
                                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-md border border-emerald-200 font-bold truncate shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        PB Djarum
                                    </div>
                                </div>
                            )}

                            {isCurrentMonth && Math.random() > 0.9 && (
                                <div className="mt-1 space-y-1 pointe-events-none relative z-10">
                                    <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-100/80 px-2 py-1 rounded-md border border-amber-200 font-bold truncate shadow-sm">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        Full
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
