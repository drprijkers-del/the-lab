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

  const itemsByStatus = {
    review: backlogItems.filter(i => i.status === 'review'),
    exploring: backlogItems.filter(i => i.status === 'exploring'),
    decided: backlogItems.filter(i => i.status === 'decided'),
  }

  async function handleBacklogSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

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

  function getProductBadge(product: ProductType) {
    const colors = {
      delta: 'bg-cyan-100 text-cyan-700',
      pulse: 'bg-purple-100 text-purple-700',
      shared: 'bg-stone-100 text-stone-700',
    }
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[product]}`}>
        {product}
      </span>
    )
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

  function getStatusBadge(status: BacklogStatus, decision?: BacklogDecision | null) {
    if (status === 'decided' && decision) {
      const colors = decision === 'building' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      const label = decision === 'building' ? 'Building' : 'Not doing'
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors}`}>{label}</span>
    }

    const statusLabels: Record<BacklogStatus, { label: string; color: string }> = {
      review: { label: 'Review', color: 'bg-yellow-100 text-yellow-700' },
      exploring: { label: 'Exploring', color: 'bg-blue-100 text-blue-700' },
      decided: { label: 'Decided', color: 'bg-stone-100 text-stone-700' },
    }

    const s = statusLabels[status]
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>{s.label}</span>
  }

  return (
    <div className="min-h-screen bg-stone-900 text-white">
      {/* Header */}
      <header className="border-b border-stone-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/super-admin/dashboard" className="text-stone-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="font-bold text-lg">Backlog & Release Notes</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
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

        {/* Backlog Tab */}
        {activeTab === 'backlog' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setEditingBacklog(null); setFormStatus('review'); setShowBacklogForm(true) }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium"
              >
                + New item
              </button>
            </div>

            {/* Backlog Form */}
            {showBacklogForm && (
              <div className="bg-stone-800 border border-stone-700 rounded-xl p-6 mb-6">
                <h2 className="font-medium text-white mb-4">
                  {editingBacklog ? 'Edit item' : 'New backlog item'}
                </h2>
                <form onSubmit={handleBacklogSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1">Product</label>
                      <select
                        name="product"
                        defaultValue={editingBacklog?.product || 'delta'}
                        className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
                      >
                        <option value="delta">Delta</option>
                        <option value="pulse">Pulse</option>
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
                          defaultValue={editingBacklog?.decision || 'building'}
                          className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
                        >
                          <option value="building">Building</option>
                          <option value="not_doing">Not doing</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1">Date</label>
                      <input
                        type="date"
                        name="reviewed_at"
                        defaultValue={editingBacklog?.reviewed_at || new Date().toISOString().split('T')[0]}
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
                    <p className="text-xs text-stone-500 mb-2">Where did this request come from? (e.g., user feedback, internal idea, customer interview)</p>
                    <input
                      name="source_en"
                      defaultValue={editingBacklog?.source_en || ''}
                      required
                      placeholder="e.g., User feedback via backlog page"
                      className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white placeholder:text-stone-500"
                    />
                  </div>

                  {formStatus === 'decided' && (
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1">Our take</label>
                      <p className="text-xs text-stone-500 mb-2">Explain the decision - why are we building or not building this?</p>
                      <textarea
                        name="our_take_en"
                        rows={3}
                        defaultValue={editingBacklog?.our_take_en || ''}
                        placeholder="Explain the reasoning behind this decision..."
                        className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white placeholder:text-stone-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => { setShowBacklogForm(false); setEditingBacklog(null); setFormStatus('review') }}
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
            )}

            {/* Backlog Items List */}
            <div className="space-y-6">
              {(['review', 'exploring', 'decided'] as BacklogStatus[]).map(status => (
                <div key={status}>
                  <h3 className="text-sm font-medium text-stone-400 mb-3 uppercase tracking-wide">
                    {status === 'review' && 'Under review'}
                    {status === 'exploring' && 'Exploring'}
                    {status === 'decided' && 'Decided'}
                    {' '}({itemsByStatus[status].length})
                  </h3>

                  {itemsByStatus[status].length === 0 ? (
                    <p className="text-sm text-stone-500 italic">No items</p>
                  ) : (
                    <div className="space-y-2">
                      {itemsByStatus[status].map(item => (
                        <div key={item.id} className="bg-stone-800 border border-stone-700 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {getProductBadge(item.product)}
                                <span className="text-xs text-stone-400">{getCategoryLabel(item.category)}</span>
                                {getStatusBadge(item.status, item.decision)}
                              </div>
                              <p className="font-medium text-white">{item.title_en}</p>
                              <p className="text-sm text-stone-400 mt-1 line-clamp-2">{item.our_take_en}</p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => { setEditingBacklog(item); setFormStatus(item.status); setShowBacklogForm(true) }}
                                className="p-2 text-stone-400 hover:text-white"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteBacklogId(item.id)}
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
                          <span className="text-xs font-mono text-stone-400">v{note.version}</span>
                          <span className="text-xs text-stone-500">
                            {new Date(note.released_at).toLocaleDateString('en-US')}
                          </span>
                        </div>
                        <p className="font-medium text-white">{note.title_en}</p>
                        <p className="text-sm text-stone-400 mt-1 line-clamp-2">{note.description_en}</p>
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

  function updateChange(index: number, lang: 'nl' | 'en', value: string) {
    const updated = [...changes]
    updated[index][lang] = value
    setChanges(updated)
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('changes', JSON.stringify(changes.filter(c => c.nl || c.en)))
    onSubmit({ ...e, currentTarget: { ...e.currentTarget, elements: e.currentTarget.elements } } as React.FormEvent<HTMLFormElement>)
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">Product</label>
          <select
            name="product"
            defaultValue={editingRelease?.product || 'delta'}
            className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
          >
            <option value="delta">Delta</option>
            <option value="pulse">Pulse</option>
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
            defaultValue={editingRelease?.released_at || new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">Titel (NL)</label>
          <input
            name="title_nl"
            defaultValue={editingRelease?.title_nl || ''}
            required
            className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">Title (EN)</label>
          <input
            name="title_en"
            defaultValue={editingRelease?.title_en || ''}
            required
            className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">Beschrijving (NL)</label>
          <textarea
            name="description_nl"
            rows={2}
            defaultValue={editingRelease?.description_nl || ''}
            required
            className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">Description (EN)</label>
          <textarea
            name="description_en"
            rows={2}
            defaultValue={editingRelease?.description_en || ''}
            required
            className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-300 mb-2">Changes</label>
        <div className="space-y-2">
          {changes.map((change, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  value={change.nl}
                  onChange={(e) => updateChange(index, 'nl', e.target.value)}
                  placeholder="NL"
                  className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white text-sm"
                />
                <input
                  value={change.en}
                  onChange={(e) => updateChange(index, 'en', e.target.value)}
                  placeholder="EN"
                  className="w-full px-3 py-2 rounded-lg border border-stone-600 bg-stone-700 text-white text-sm"
                />
              </div>
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
