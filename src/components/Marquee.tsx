import { cn } from "@/lib/utils"

interface MarqueeProps {
    className?: string
    children?: React.ReactNode
    pauseOnHover?: boolean
}

export function Marquee({ className, children, pauseOnHover = false }: MarqueeProps) {
    return (
        <div className={cn("relative flex overflow-x-hidden", className)}>
            <div className={cn("animate-marquee whitespace-nowrap flex items-center", pauseOnHover && "hover:[animation-play-state:paused]")}>
                {children}
            </div>
            <div className={cn("absolute top-0 animate-marquee2 whitespace-nowrap flex items-center", pauseOnHover && "hover:[animation-play-state:paused]")}>
                {children}
            </div>
        </div>
    )
}
