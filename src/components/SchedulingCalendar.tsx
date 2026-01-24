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
    const startDate = startOfWeek(monthStart, { locale: id }) // Start on Monday (default for ID?) let's check. ID usually Monday? Standard is Sunday in JS but contextually Monday is often preferred. default date-fns is Sunday.
    const endDate = endOfWeek(monthEnd, { locale: id })

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    })

    const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

    return (
        <div className={cn("w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-2xl font-serif font-bold text-primary">
                    {format(currentMonth, "MMMM yyyy", { locale: id })}
                </h2>
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 rounded-lg p-1 mr-4">
                        <button className="px-3 py-1 text-sm font-medium bg-white shadow-sm rounded-md text-primary transition-all">Bulan</button>
                        <button className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-black transition-all">Minggu</button>
                    </div>
                    <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-full w-10 h-10 border-slate-200">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-full w-10 h-10 border-slate-200">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Grid Header (Days) */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                {weekDays.map((day) => (
                    <div key={day} className="py-4 text-center text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 auto-rows-[120px] md:auto-rows-[140px]">
                {calendarDays.map((day, dayIdx) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isDayToday = isToday(day)

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onSelectDate?.(day)}
                            className={cn(
                                "relative border-b border-r border-slate-50 p-3 transition-all duration-200 cursor-pointer group hover:bg-slate-50",
                                !isCurrentMonth && "bg-slate-50/30 text-gray-300",
                                isSelected && "bg-primary/5 ring-1 ring-inset ring-primary z-10",
                                dayIdx % 7 === 6 && "border-r-0" // Remove right border for last col
                            )}
                        >
                            {/* Day Number */}
                            <div className="flex items-center justify-between pointer-events-none">
                                <span className={cn(
                                    "text-lg font-medium w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                                    isDayToday ? "bg-primary text-white" : "text-gray-700",
                                    !isCurrentMonth && "text-gray-300"
                                )}>
                                    {format(day, "d")}
                                </span>
                                {isSelected && <span className="text-xs font-bold text-primary">Terpilih</span>}
                            </div>

                            {/* Add Event Overlay (On Hover) */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <Plus className="w-3 h-3" />
                                    Booking
                                </div>
                            </div>

                            {/* Mock Events (Randomly show for demo) */}
                            {isCurrentMonth && Math.random() > 0.8 && (
                                <div className="mt-3 space-y-1 pointe-events-none">
                                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-medium truncate">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        PB Djarum (18:00)
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
