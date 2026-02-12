import { HomeContent } from '@/components/home/home-content'

export default async function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Pulse Labs',
            url: 'https://teamlab.app',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: 'Team health tools for agile coaches and scrum masters. Vibe Check, Way of Work, Team Feedback & AI Coach Preparation.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
              description: 'Free tier — 1 team, all core tools',
            },
            creator: {
              '@type': 'Organization',
              name: 'Pink Pollos',
              url: 'https://pinkpollos.nl',
            },
          }),
        }}
      />
      <HomeContent />
    </>
  )
}
