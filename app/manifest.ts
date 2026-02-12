import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pulse Labs — Team Health Tools',
    short_name: 'Pulse Labs',
    description: 'Vibe Check, Way of Work, Team Feedback & AI Coach Preparation for agile teams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1c1917',
    theme_color: '#e11d48',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/apple-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
  }
}
