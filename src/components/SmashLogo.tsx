
interface SmashLogoProps {
    className?: string; // Expects size classes (w-10 h-10) and background color (bg-black)
}

export function SmashLogo({ className = "w-10 h-10 bg-black" }: SmashLogoProps) {
    return (
        <div
            className={className}
            style={{
                maskImage: `url(/smash-logo.svg)`,
                maskRepeat: 'no-repeat',
                maskSize: 'contain',
                maskPosition: 'center',
                WebkitMaskImage: `url(/smash-logo.svg)`,
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskSize: 'contain',
                WebkitMaskPosition: 'center'
            }}
        />
    )
}
