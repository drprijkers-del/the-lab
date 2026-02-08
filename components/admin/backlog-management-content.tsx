'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BacklogItem,
  ReleaseNote,
  ProductType,
  BacklogCategory,
  BacklogStatus,
  BacklogDecision,
  createBacklogItem,
  updateBacklogItem,
  deleteBacklogItem,
  createReleaseNote,
  updateReleaseNote,
  deleteReleaseNote,
} from '@/domain/backlog/actions'
import { ConfirmModal } from '@/components/ui/modal'

interface BacklogManagementContentProps {
  backlogItems: BacklogItem[]
  releaseNotes: ReleaseNote[]
}

type Tab = 'backlog' | 'releases'
type KanbanColumn = 'review' | 'exploring' | 'building' | 'done' | 'not_doing'

export function BacklogManagementContent({ backlogItems, releaseNotes }: BacklogManagementContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('backlog')
  const [showBacklogForm, setShowBacklogForm] = useState(false)
  const [showReleaseForm, setShowReleaseForm] = useState(false)
  const [editingBacklog, setEditingBacklog] = useState<BacklogItem | null>(null)
  const [editingRelease, setEditingRelease] = useState<ReleaseNote | null>(null)
  const [deleteBacklogId, setDeleteBacklogId] = useState<string | null>(null)
  const [deleteReleaseId, setDeleteReleaseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formStatus, setFormStatus] = useState<BacklogStatus>('review')
  const [formDecision, setFormDecision] = useState<BacklogDecision | ''>('')
  const [draggedItem, setDraggedItem] = useState<BacklogItem | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumn | null>(null)

  // Group items by kanban columns
  const itemsByColumn: Record<KanbanColumn, BacklogItem[]> = {
    review: backlogItems.filter(i => i.status === 'review'),
    exploring: backlogItems.filter(i => i.status === 'exploring'),
    building: backlogItems.filter(i => i.status === 'decided' && i.decision === 'building'),
    done: backlogItems.filter(i => i.status === 'decided' && i.decision === 'done'),
    not_doing: backlogItems.filter(i => i.status === 'decided' && i.decision === 'not_doing'),
  }

  // Extract version from rationale (format: "Released in vX.X.X - ...")
  function extractVersion(rationale: string | null): string | null {
    if (!rationale) return null
    const match = rationale.match(/^Released in (v[\d.]+)/)
    return match ? match[1] : null
  }

  const columnConfig: Record<KanbanColumn, { title: string; color: string; bgColor: string }> = {
    review: { title: 'Under Review', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
    exploring: { title: 'Exploring', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30' },
    building: { title: 'Building', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/30' },
    done: { title: 'Done', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/30' },
    not_doing: { title: 'Not Doing', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
  }

  async function handleDrop(targetColumn: KanbanColumn) {
    if (!draggedItem) return

    // Determine new status and decision based on column
    let newStatus: BacklogStatus
    let newDecision: BacklogDecision | null = null

    if (targetColumn === 'review') {
      newStatus = 'review'
    } else if (targetColumn === 'exploring') {
      newStatus = 'exploring'
    } else {
      newStatus = 'decided'
      if (targetColumn === 'building') newDecision = 'building'
      else if (targetColumn === 'done') newDecision = 'done'
      else newDecision = 'not_doing'
    }

    // Skip if no change
    if (draggedItem.status === newStatus && draggedItem.decision === newDecision) {
      setDraggedItem(null)
      setDragOverColumn(null)
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.set('product', draggedItem.product)
    formData.set('category', draggedItem.category)
    formData.set('status', newStatus)
    if (newDecision) formData.set('decision', newDecision)
    formData.set('title_en', draggedItem.title_en)
    formData.set('source_en', draggedItem.source_en || '')

    // If moving to Done, add release version to rationale
    let ourTake = draggedItem.our_take_en || ''
    if (targetColumn === 'done' && releaseNotes.length > 0) {
      const latestRelease = releaseNotes[0]
      if (!ourTake.startsWith('Released in')) {
        ourTake = `Released in v${latestRelease.version} - ${ourTake}`.trim()
      }
    }
    formData.set('our_take_en', ourTake)
    formData.set('reviewed_at', draggedItem.reviewed_at || new Date().toISOString().split('T')[0])

    await updateBacklogItem(draggedItem.id, formData)

    setLoading(false)
    setDraggedItem(null)
    setDragOverColumn(null)
    router.refresh()
  }

  async function handleBacklogSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    // If decision is 'done', prepend release version to our_take
    const decision = formData.get('decision')
    const releaseVersion = formData.get('release_version')
    if (decision === 'done' && releaseVersion) {
      let ourTake = (formData.get('our_take_en') as string) || ''
      // Remove any existing "Released in" prefix
      ourTake = ourTake.replace(/^Released in v[\d.]+ - ?/, '')
      ourTake = `Released in v${releaseVersion}${ourTake ? ' - ' + ourTake : ''}`
      formData.set('our_take_en', ourTake)
    }

    let result: { success: boolean; error?: string; id?: string }
    if (editingBacklog) {
      result = await updateBacklogItem(editingBacklog.id, formData)
    } else {
      result = await createBacklogItem(formData)
    }

    setLoading(false)

    if (!result.success) {
      alert('Error: ' + (result.error || 'Unknown error'))
      return
    }

    setShowBacklogForm(false)
    setEditingBacklog(null)
    setFormDecision('')
    router.refresh()
  }

  async function handleReleaseSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    let result
    if (editingRelease) {
      result = await updateReleaseNote(editingRelease.id, formData)
    } else {
      result = await createReleaseNote(formData)
    }

    setLoading(false)

    if (!result.success) {
      alert('Error: ' + (result.error || 'Unknown error'))
      return
    }

    setShowReleaseForm(false)
    setEditingRelease(null)
    router.refresh()
  }

  async function handleDeleteBacklog() {
    if (!deleteBacklogId) return
    setLoading(true)
    await deleteBacklogItem(deleteBacklogId)
    setLoading(false)
    setDeleteBacklogId(null)
    router.refresh()
  }

  async function handleDeleteRelease() {
    if (!deleteReleaseId) return
    setLoading(true)
    await deleteReleaseNote(deleteReleaseId)
    setLoading(false)
    setDeleteReleaseId(null)
    router.refresh()
  }

  function getCategoryLabel(category: BacklogCategory) {
    const labels: Record<BacklogCategory, string> = {
      ux: 'UX',
      statements: 'Statements',
      analytics: 'Analytics',
      integration: 'Integration',
      features: 'Features',
    }
    return labels[category]
  }

  function getCategoryBadge(category: BacklogCategory) {
    const colors: Record<BacklogCategory, string> = {
      ux: 'bg-purple-100 text-purple-700',
      statements: 'bg-blue-100 text-blue-700',
      analytics: 'bg-cyan-100 text-cyan-700',
      integration: 'bg-amber-100 text-amber-700',
      features: 'bg-emerald-100 text-emerald-700',
    }
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[category]}`}>
        {getCategoryLabel(category)}
      </span>
    )
  }

  function getProductBadge(product: ProductType) {
    const config: Record<ProductType, { label: string; color: string }> = {
      wow: { label: 'Way of Work', color: 'bg-cyan-900 text-cyan-300' },
      vibe: { label: 'Vibe', color: 'bg-purple-900 text-purple-300' },
      shared: { label: 'Shared', color: 'bg-stone-700 text-stone-300' },
    }
    const p = config[product]
    return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.color}`}>{p.label}</span>
  }

  return (
    <div className="min-h-screen bg-stone-900 text-white">
      {/* Header */}
      <header className="border-b border-stone-700 p-4">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/super-admin/dashboard" className="text-stone-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="font-bold text-lg">Backlog & Release Notes</span>
          </div>
          <Link
            href="/teams"
            className="px-3 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Teams
          </Link>
          <Link
            href="/teams"
            target="_blank"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            View public page
          </Link>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-stone-700">
          <button
            onClick={() => setActiveTab('backlog')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'backlog'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            Backlog ({backlogItems.length})
          </button>
          <button
            onClick={() => setActiveTab('releases')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'releases'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            Release Notes ({releaseNotes.length})
          </button>
        </div>

        {/* Backlog Tab - Kanban Board */}
        {activeTab === 'backlog' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-stone-500">Drag items between columns to change status</p>
              <button
                onClick={() => { setEditingBacklog(null); setFormStatus('review'); setFormDecision(''); setShowBacklogForm(true) }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium"
              >
                + New item
              </button>
            </div>

            {/* Edit Form Modal */}
            {showBacklogForm && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowBacklogForm(false); setEditingBacklog(null); setFormDecision('') }}>
                <div className="bg-stone-800 border border-stone-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h2 className="font-medium text-white mb-4 text-lg">
                    {editingBacklog ? 'Edit item' : 'New backlog item'}
                  </h2>
                  <form onSubmit={handleBacklogSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Product</label>
                        <select
                          name="product"
                          defaultValue={editingBacklog?.product || 'vibe'}
                          className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
                        >
                          <option value="vibe">Vibe</option>
                          <option value="wow">Way of Work</option>
                          <option value="shared">Shared</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Category</label>
                        <select
                          name="category"
                          defaultValue={editingBacklog?.category || 'features'}
                          className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
                        >
                          <option value="ux">UX</option>
                          <option value="statements">Statements</option>
                          <option value="analytics">Analytics</option>
                          <option value="integration">Integration</option>
                          <option value="features">Features</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Status</label>
                        <select
                          name="status"
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as BacklogStatus)}
                          className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
                        >
                          <option value="review">Review</option>
                          <option value="exploring">Exploring</option>
                          <option value="decided">Decided</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formStatus === 'decided' && (
                        <div>
                          <label className="block text-sm font-medium text-stone-300 mb-1">Decision</label>
                          <select
                            name="decision"
                            value={formDecision || editingBacklog?.decision || 'building'}
                            onChange={(e) => setFormDecision(e.target.value as BacklogDecision)}
                            className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
                          >
                            <option value="building">Building</option>
                            <option value="done">Done (Released)</option>
                            <option value="not_doing">Not doing</option>
                          </select>
                        </div>
                      )}
                      {formStatus === 'decided' && (formDecision === 'done' || (!formDecision && editingBacklog?.decision === 'done')) && (
                        <div>
                          <label className="block text-sm font-medium text-stone-300 mb-1">Release Version</label>
                          <select
                            name="release_version"
                            defaultValue={extractVersion(editingBacklog?.our_take_en || null) || (releaseNotes[0]?.version || '')}
                            className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
                          >
                            {releaseNotes.map(release => (
                              <option key={release.id} value={release.version}>
                                v{release.version} - {release.title_en}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Date</label>
                        <input
                          type="date"
                          name="reviewed_at"
                          defaultValue={editingBacklog?.reviewed_at?.split('T')[0] || new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1">Title</label>
                      <input
                        name="title_en"
                        defaultValue={editingBacklog?.title_en || ''}
                        required
                        placeholder="What is being requested?"
                        className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white placeholder:text-stone-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1">Source</label>
                      <p className="text-xs text-stone-500 mb-2">Where did this request come from?</p>
                      <input
                        name="source_en"
                        defaultValue={editingBacklog?.source_en || ''}
                        placeholder="e.g., User feedback, internal idea, customer interview"
                        className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white placeholder:text-stone-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1">Our take</label>
                      <p className="text-xs text-stone-500 mb-2">What&apos;s our perspective on this?</p>
                      <textarea
                        name="our_take_en"
                        rows={3}
                        defaultValue={editingBacklog?.our_take_en || ''}
                        placeholder="Explain the reasoning..."
                        className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white placeholder:text-stone-500"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => { setShowBacklogForm(false); setEditingBacklog(null); setFormStatus('review'); setFormDecision('') }}
                        className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : (editingBacklog ? 'Save' : 'Add')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {(['review', 'exploring', 'building', 'done', 'not_doing'] as KanbanColumn[]).map(column => (
                <div
                  key={column}
                  className={`rounded-xl border-2 transition-colors ${
                    dragOverColumn === column
                      ? columnConfig[column].bgColor + ' border-dashed'
                      : 'bg-stone-800/50 border-stone-700'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverColumn(column) }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={(e) => { e.preventDefault(); handleDrop(column) }}
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-stone-700">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-semibold ${columnConfig[column].color}`}>
                        {columnConfig[column].title}
                      </h3>
                      <span className="text-xs text-stone-500 bg-stone-700/50 px-2 py-0.5 rounded-full">
                        {itemsByColumn[column].length}
                      </span>
                    </div>
                  </div>

                  {/* Column Items */}
                  <div className="p-2 space-y-2 min-h-[200px]">
                    {itemsByColumn[column].length === 0 ? (
                      <p className="text-xs text-stone-600 text-center py-8">
                        Drop items here
                      </p>
                    ) : (
                      itemsByColumn[column].map(item => {
                        const version = extractVersion(item.our_take_en)
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => setDraggedItem(item)}
                            onDragEnd={() => { setDraggedItem(null); setDragOverColumn(null) }}
                            onClick={() => { setEditingBacklog(item); setFormStatus(item.status); setFormDecision(item.decision || ''); setShowBacklogForm(true) }}
                            className={`bg-stone-800 border border-stone-700 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-stone-600 transition-all ${
                              draggedItem?.id === item.id ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-1.5 flex-wrap mb-2">
                              {getProductBadge(item.product)}
                              {getCategoryBadge(item.category)}
                              {version && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-900/50 text-cyan-300">
                                  {version}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-white line-clamp-2">{item.title_en}</p>
                            {item.source_en && (
                              <p className="text-[10px] text-stone-500 mt-1.5 line-clamp-1">
                                {item.source_en}
                              </p>
                            )}
                            <div className="flex items-center justify-end mt-2 pt-2 border-t border-stone-700/50">
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteBacklogId(item.id) }}
                                className="p-1 text-stone-500 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Release Notes Tab */}
        {activeTab === 'releases' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setEditingRelease(null); setShowReleaseForm(true) }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium"
              >
                + New release
              </button>
            </div>

            {/* Release Form */}
            {showReleaseForm && (
              <div className="bg-stone-800 border border-stone-700 rounded-xl p-6 mb-6">
                <h2 className="font-medium text-white mb-4">
                  {editingRelease ? 'Edit release' : 'New release note'}
                </h2>
                <ReleaseNoteForm
                  editingRelease={editingRelease}
                  loading={loading}
                  onSubmit={handleReleaseSubmit}
                  onCancel={() => { setShowReleaseForm(false); setEditingRelease(null) }}
                />
              </div>
            )}

            {/* Release Notes List */}
            {releaseNotes.length === 0 ? (
              <p className="text-sm text-stone-500 italic text-center py-8">No release notes yet</p>
            ) : (
              <div className="space-y-2">
                {releaseNotes.map(note => (
                  <div key={note.id} className="bg-stone-800 border border-stone-700 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {getProductBadge(note.product)}
                          <span className="text-xs font-mono text-cyan-400">v{note.version}</span>
                          <span className="text-xs text-stone-500">
                            {new Date(note.released_at).toLocaleDateString('en-US')}
                          </span>
                        </div>
                        <p className="font-medium text-white">{note.title_en}</p>
                        {note.description_en && (
                          <p className="text-sm text-stone-400 mt-1 line-clamp-2">{note.description_en}</p>
                        )}
                        {note.changes && note.changes.length > 0 && (
                          <div className="mt-2 text-xs text-stone-500">
                            {note.changes.length} change{note.changes.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingRelease(note); setShowReleaseForm(true) }}
                          className="p-2 text-stone-400 hover:text-white"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteReleaseId(note.id)}
                          className="p-2 text-stone-400 hover:text-red-400"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Backlog Modal */}
      <ConfirmModal
        isOpen={!!deleteBacklogId}
        onClose={() => setDeleteBacklogId(null)}
        onConfirm={handleDeleteBacklog}
        title="Delete item"
        message="Are you sure you want to delete this item? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={loading}
      />

      {/* Delete Release Modal */}
      <ConfirmModal
        isOpen={!!deleteReleaseId}
        onClose={() => setDeleteReleaseId(null)}
        onConfirm={handleDeleteRelease}
        title="Delete release note"
        message="Are you sure you want to delete this release note? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={loading}
      />
    </div>
  )
}

interface ReleaseNoteFormProps {
  editingRelease: ReleaseNote | null
  loading: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

function ReleaseNoteForm({ editingRelease, loading, onSubmit, onCancel }: ReleaseNoteFormProps) {
  const [changes, setChanges] = useState<{ nl: string; en: string }[]>(
    editingRelease?.changes || [{ nl: '', en: '' }]
  )

  function addChange() {
    setChanges([...changes, { nl: '', en: '' }])
  }

  function removeChange(index: number) {
    setChanges(changes.filter((_, i) => i !== index))
  }

  function updateChange(index: number, value: string) {
    const updated = [...changes]
    // Store same value for both NL and EN (English only for simplicity)
    updated[index] = { nl: value, en: value }
    setChanges(updated)
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('changes', JSON.stringify(changes.filter(c => c.en)))

    // Create a synthetic event with the modified formData
    const syntheticEvent = {
      ...e,
      currentTarget: form,
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>

    onSubmit(syntheticEvent)
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">Product</label>
          <select
            name="product"
            defaultValue={editingRelease?.product || 'vibe'}
            className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
          >
            <option value="vibe">Vibe</option>
            <option value="wow">Way of Work</option>
            <option value="shared">Shared</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">Version</label>
          <input
            name="version"
            placeholder="1.0.0"
            defaultValue={editingRelease?.version || ''}
            required
            className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">Release date</label>
          <input
            type="date"
            name="released_at"
            defaultValue={editingRelease?.released_at?.split('T')[0] || new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Title</label>
        <input
          name="title_en"
          defaultValue={editingRelease?.title_en || ''}
          required
          placeholder="What's in this release?"
          className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white placeholder:text-stone-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Description</label>
        <textarea
          name="description_en"
          rows={2}
          defaultValue={editingRelease?.description_en || ''}
          placeholder="Brief summary of changes..."
          className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white placeholder:text-stone-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-300 mb-2">Changes</label>
        <div className="space-y-2">
          {changes.map((change, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                value={change.en}
                onChange={(e) => updateChange(index, e.target.value)}
                placeholder="What changed?"
                className="flex-1 px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white text-sm placeholder:text-stone-500"
              />
              <button
                type="button"
                onClick={() => removeChange(index)}
                className="p-2 text-stone-400 hover:text-red-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addChange}
          className="mt-2 text-sm text-cyan-400 hover:text-cyan-300"
        >
          + Add change
        </button>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {loading ? 'Saving...' : (editingRelease ? 'Save' : 'Add')}
        </button>
      </div>

      <input type="hidden" name="changes" value={JSON.stringify(changes)} />
    </form>
  )
}
