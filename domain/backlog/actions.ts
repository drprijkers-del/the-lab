'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types matching database schema
export type ProductType = 'delta' | 'pulse' | 'shared'
export type BacklogCategory = 'ux' | 'statements' | 'analytics' | 'integration' | 'features'
export type BacklogStatus = 'review' | 'exploring' | 'decided'
export type BacklogDecision = 'building' | 'not_doing'

export interface BacklogItem {
  id: string
  product: ProductType
  category: BacklogCategory
  status: BacklogStatus
  decision: BacklogDecision | null
  title_nl: string
  title_en: string
  source_nl: string
  source_en: string
  our_take_nl: string
  our_take_en: string
  rationale_nl: string | null
  rationale_en: string | null
  reviewed_at: string
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
  description_nl: string
  description_en: string
  changes: { nl: string; en: string }[]
  released_at: string
  created_at: string
  updated_at: string
}

// ============================================================================
// BACKLOG ITEMS
// ============================================================================

/**
 * Get all backlog items, optionally filtered by product
 */
export async function getBacklogItems(product?: ProductType): Promise<BacklogItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('backlog_items')
    .select('*')
    .order('status', { ascending: true })
    .order('reviewed_at', { ascending: false })

  if (product) {
    // Show items for this product OR shared items
    query = query.or(`product.eq.${product},product.eq.shared`)
  }

  const { data, error } = await query

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
  const supabase = await createClient()

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

  const item = {
    product: formData.get('product') as ProductType,
    category: formData.get('category') as BacklogCategory,
    status: formData.get('status') as BacklogStatus,
    decision: formData.get('decision') as BacklogDecision | null || null,
    title_nl: formData.get('title_nl') as string,
    title_en: formData.get('title_en') as string,
    source_nl: formData.get('source_nl') as string,
    source_en: formData.get('source_en') as string,
    our_take_nl: formData.get('our_take_nl') as string,
    our_take_en: formData.get('our_take_en') as string,
    rationale_nl: formData.get('rationale_nl') as string || null,
    rationale_en: formData.get('rationale_en') as string || null,
    reviewed_at: formData.get('reviewed_at') as string || new Date().toISOString().split('T')[0],
    decided_at: formData.get('decided_at') as string || null,
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
  const decision = status === 'decided' ? (formData.get('decision') as BacklogDecision) : null
  const decidedAt = status === 'decided' ? (formData.get('decided_at') as string || new Date().toISOString().split('T')[0]) : null

  const updates = {
    product: formData.get('product') as ProductType,
    category: formData.get('category') as BacklogCategory,
    status,
    decision,
    title_nl: formData.get('title_nl') as string,
    title_en: formData.get('title_en') as string,
    source_nl: formData.get('source_nl') as string,
    source_en: formData.get('source_en') as string,
    our_take_nl: formData.get('our_take_nl') as string,
    our_take_en: formData.get('our_take_en') as string,
    rationale_nl: formData.get('rationale_nl') as string || null,
    rationale_en: formData.get('rationale_en') as string || null,
    reviewed_at: formData.get('reviewed_at') as string,
    decided_at: decidedAt,
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
 * Get all release notes, optionally filtered by product
 */
export async function getReleaseNotes(product?: ProductType): Promise<ReleaseNote[]> {
  const supabase = await createClient()

  let query = supabase
    .from('release_notes')
    .select('*')
    .order('released_at', { ascending: false })

  if (product) {
    query = query.or(`product.eq.${product},product.eq.shared`)
  }

  const { data, error } = await query

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
  const supabase = await createClient()

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
    product: formData.get('product') as ProductType,
    version: formData.get('version') as string,
    title_nl: formData.get('title_nl') as string,
    title_en: formData.get('title_en') as string,
    description_nl: formData.get('description_nl') as string,
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
    product: formData.get('product') as ProductType,
    version: formData.get('version') as string,
    title_nl: formData.get('title_nl') as string,
    title_en: formData.get('title_en') as string,
    description_nl: formData.get('description_nl') as string,
    description_en: formData.get('description_en') as string,
    changes,
    released_at: formData.get('released_at') as string,
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
