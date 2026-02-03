import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Smash & Serve',
        short_name: 'Smash',
        description: 'A next-gen court booking experience',
        start_url: '/',
        display: 'standalone',
        background_color: '#FAFAFA',
        theme_color: '#000000',
        icons: [
            {
                src: '/smash-logo.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    }
}
