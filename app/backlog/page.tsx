import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Backlog | Team Lab',
  description: 'What we\'re building and what we\'ve decided',
}

export default function BacklogPage() {
  // Backlog is now a tab within the Teams page
  redirect('/teams')
}
