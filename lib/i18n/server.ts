import { cookies } from 'next/headers'
import { translations, Language } from './translations'

const STORAGE_KEY = 'mood_app_language'

export async function getTranslations() {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get(STORAGE_KEY)
  const language: Language = (langCookie?.value === 'en' ? 'en' : 'nl')

  return translations[language]
}

export async function getLanguage(): Promise<Language> {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get(STORAGE_KEY)
  return langCookie?.value === 'en' ? 'en' : 'nl'
}
