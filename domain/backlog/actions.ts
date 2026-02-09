'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types matching database schema
export type ProductType = 'wow' | 'vibe' | 'shared'
export type BacklogCategory = 'ux' | 'statements' | 'analytics' | 'integration' | 'features'
export type BacklogStatus = 'review' | 'exploring' | 'decided'
export type BacklogDecision = 'building' | 'not_doing' | 'done'

export interface BacklogItem {
  id: string
  product: ProductType
  category: BacklogCategory
  status: BacklogStatus
  decision: BacklogDecision | null
  title_nl: string
  title_en: string
  source_nl: string | null
  source_en: string | null
  our_take_nl: string | null
  our_take_en: string | null
  rationale_nl: string | null
  rationale_en: string | null
  reviewed_at: string | null
  decided_at: string | null
  created_at: string
  updated_at: string
}

export interface ReleaseNote {
  id: string
  product: ProductType
  version: string
  title_nl: string
  title_en: string
  description_nl: string | null
  description_en: string | null
  changes: { nl: string; en: string }[]
  released_at: string
  created_at: string
  updated_at: string
}

// ============================================================================
// BACKLOG ITEMS
// ============================================================================

/**
 * Get all backlog items (uses admin client to bypass RLS for public read access)
 */
export async function getBacklogItems(): Promise<BacklogItem[]> {
  // Use admin client to bypass RLS - backlog is public information
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('backlog_items')
    .select('*')
    .order('status', { ascending: true })
    .order('reviewed_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching backlog items:', error)
    return []
  }

  return data || []
}

/**
 * Get a single backlog item by ID
 */
export async function getBacklogItem(id: string): Promise<BacklogItem | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('backlog_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching backlog item:', error)
    return null
  }

  return data
}

/**
 * Create a new backlog item (Super Admin only)
 */
export async function createBacklogItem(formData: FormData): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createAdminClient()

  const status = formData.get('status') as BacklogStatus
  const titleEn = formData.get('title_en') as string
  const sourceEn = formData.get('source_en') as string | null
  const ourTakeEn = formData.get('our_take_en') as string | null

  const item = {
    product: (formData.get('product') as ProductType) || 'vibe',
    category: formData.get('category') as BacklogCategory,
    status,
    decision: status === 'decided' ? (formData.get('decision') as BacklogDecision) : null,
    title_nl: titleEn, // English only for simplicity
    title_en: titleEn,
    source_nl: sourceEn,
    source_en: sourceEn,
    our_take_nl: ourTakeEn,
    our_take_en: ourTakeEn,
    reviewed_at: formData.get('reviewed_at') as string || new Date().toISOString().split('T')[0],
    decided_at: status === 'decided' ? new Date().toISOString().split('T')[0] : null,
  }

  const { data, error } = await supabase
    .from('backlog_items')
    .insert(item)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating backlog item:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/feedback/backlog')
  revalidatePath('/super-admin/backlog')
  return { success: true, id: data.id }
}

/**
 * Update a backlog item (Super Admin only)
 */
export async function updateBacklogItem(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient()

  const status = formData.get('status') as BacklogStatus
  const titleEn = formData.get('title_en') as string
  const sourceEn = formData.get('source_en') as string | null
  const ourTakeEn = formData.get('our_take_en') as string | null

  const updates = {
    product: (formData.get('product') as ProductType) || 'vibe',
    category: formData.get('category') as BacklogCategory,
    status,
    decision: status === 'decided' ? (formData.get('decision') as BacklogDecision) : null,
    title_nl: titleEn,
    title_en: titleEn,
    source_nl: sourceEn,
    source_en: sourceEn,
    our_take_nl: ourTakeEn,
    our_take_en: ourTakeEn,
    reviewed_at: formData.get('reviewed_at') as string,
    decided_at: status === 'decided' ? new Date().toISOString().split('T')[0] : null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('backlog_items')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating backlog item:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/feedback/backlog')
  revalidatePath('/super-admin/backlog')
  return { success: true }
}

/**
 * Delete a backlog item (Super Admin only)
 */
export async function deleteBacklogItem(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('backlog_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting backlog item:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/feedback/backlog')
  revalidatePath('/super-admin/backlog')
  return { success: true }
}

// ============================================================================
// RELEASE NOTES
// ============================================================================

/**
 * Get all release notes (uses admin client to bypass RLS for public read access)
 */
export async function getReleaseNotes(): Promise<ReleaseNote[]> {
  // Use admin client to bypass RLS - release notes are public information
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('release_notes')
    .select('*')
    .order('released_at', { ascending: false })

  if (error) {
    console.error('Error fetching release notes:', error)
    return []
  }

  return data || []
}

/**
 * Get a single release note by ID
 */
export async function getReleaseNote(id: string): Promise<ReleaseNote | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('release_notes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching release note:', error)
    return null
  }

  return data
}

/**
 * Create a new release note (Super Admin only)
 */
export async function createReleaseNote(formData: FormData): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createAdminClient()

  // Parse changes from form (JSON string of array)
  let changes: { nl: string; en: string }[] = []
  const changesJson = formData.get('changes') as string
  if (changesJson) {
    try {
      changes = JSON.parse(changesJson)
    } catch {
      // Keep empty array
    }
  }

  const note = {
    product: (formData.get('product') as ProductType) || 'vibe',
    version: formData.get('version') as string,
    title_nl: formData.get('title_en') as string, // English only
    title_en: formData.get('title_en') as string,
    description_nl: formData.get('description_en') as string,
    description_en: formData.get('description_en') as string,
    changes,
    released_at: formData.get('released_at') as string || new Date().toISOString().split('T')[0],
  }

  const { data, error } = await supabase
    .from('release_notes')
    .insert(note)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating release note:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/feedback/backlog')
  revalidatePath('/super-admin/backlog')
  return { success: true, id: data.id }
}

/**
 * Update a release note (Super Admin only)
 */
export async function updateReleaseNote(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient()

  let changes: { nl: string; en: string }[] = []
  const changesJson = formData.get('changes') as string
  if (changesJson) {
    try {
      changes = JSON.parse(changesJson)
    } catch {
      // Keep empty array
    }
  }

  const updates = {
    product: (formData.get('product') as ProductType) || 'vibe',
    version: formData.get('version') as string,
    title_nl: formData.get('title_en') as string,
    title_en: formData.get('title_en') as string,
    description_nl: formData.get('description_en') as string,
    description_en: formData.get('description_en') as string,
    changes,
    released_at: formData.get('released_at') as string,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('release_notes')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating release note:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/feedback/backlog')
  revalidatePath('/super-admin/backlog')
  return { success: true }
}

/**
 * Delete a release note (Super Admin only)
 */
export async function deleteReleaseNote(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('release_notes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting release note:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/feedback/backlog')
  revalidatePath('/super-admin/backlog')
  return { success: true }
}

// ============================================================================
// PUBLIC WISH SUBMISSION
// ============================================================================

/**
 * Submit a wish from the public backlog page (creates a backlog item in 'review' status)
 */
export async function submitWish(wish: string, why: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient()

  const item = {
    product: 'vibe' as ProductType,
    category: 'features' as BacklogCategory,
    status: 'review' as BacklogStatus,
    decision: null,
    title_nl: wish,
    title_en: wish,
    source_nl: why || 'Ingediend via backlog pagina',
    source_en: why || 'Submitted via backlog page',
    our_take_nl: 'Nog te beoordelen',
    our_take_en: 'To be reviewed',
    reviewed_at: new Date().toISOString().split('T')[0],
  }

  const { error } = await supabase
    .from('backlog_items')
    .insert(item)

  if (error) {
    console.error('Error submitting wish:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/feedback/backlog')
  return { success: true }
}
