import { redirect } from 'next/navigation'

interface TeamWowPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamWowPage({ params }: TeamWowPageProps) {
  const { id } = await params
  // Redirect to unified team page with wow tab selected
  redirect(`/teams/${id}?tab=wow`)
}
