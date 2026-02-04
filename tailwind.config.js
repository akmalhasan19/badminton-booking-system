/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      colors: {
        pastel: {
          pink: '#FFC8DD',
          mint: '#BDE0FE',
          lilac: '#E2D1F9',
          yellow: '#FFF59D',
          acid: '#CCFF00',
          peach: '#FFDAC1',
        },
        neo: {
          bg: '#FFFFF0',
          black: '#121212',
          green: '#A3E635',
          pink: '#FF90E8',
          blue: '#60A5FA',
          yellow: '#FACC15',
          orange: '#FB923C',
          purple: '#C084FC',
        },
        dark: '#121212',
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px #121212',
        'hard-sm': '2px 2px 0px 0px #121212',
        'hard-lg': '8px 8px 0px 0px #121212',
        'hard-xl': '12px 12px 0px 0px #000000',
        'hard-hover': '2px 2px 0px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'marquee2': 'marquee2 25s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        marquee2: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
