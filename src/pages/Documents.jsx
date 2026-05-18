import { useState, useEffect, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Plus, Search, FileText, Trash2, Pencil, Save, X,
  ArrowLeft, ExternalLink
} from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Select from '../components/ui/Select'
import Input, { Textarea } from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDelete from '../components/ui/ConfirmDelete'
import { useDocuments } from '../hooks/useDocuments'
import { useClients } from '../hooks/useClients'
import { useListings } from '../hooks/useListings'
import { DOCUMENT_CATEGORIES, DOCUMENT_TYPES } from '../lib/realtorConstants'
import { formatDate } from '../lib/format'
import { toast } from '../lib/toast'

const empty = {
  title: '',
  category: 'General',
  document_type: 'Template',
  description: '',
  content: '',
  file_link: '',
  client_id: '',
  listing_id: '',
  status: 'Active'
}

export default function Documents() {
  const { openSidebar } = useOutletContext()
  const { documents, loading, addDocument, updateDocument, deleteDocument } = useDocuments()
  const { clients } = useClients()
  const { listings } = useListings()
  const [params, setParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [mode, setMode] = useState('view') // 'view' | 'edit'
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [showListOnMobile, setShowListOnMobile] = useState(true)

  useEffect(() => {
    const id = params.get('id')
    if (id) setSelectedId(id)
  }, [params])

  const filtered = useMemo(() => {
    return documents.filter(d => {
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          d.title?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.content?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [documents, search, categoryFilter])

  const selected = useMemo(
    () => documents.find(d => d.id === selectedId) || null,
    [documents, selectedId]
  )

  useEffect(() => {
    if (selected) {
      setForm({
        title: selected.title || '',
        category: selected.category || 'General',
        document_type: selected.document_type || 'Template',
        description: selected.description || '',
        content: selected.content || '',
        file_link: selected.file_link || '',
        client_id: selected.client_id || '',
        listing_id: selected.listing_id || '',
        status: selected.status || 'Active'
      })
      setMode('view')
    }
  }, [selected])

  function openDoc(id) {
    setSelectedId(id)
    setParams({ id }, { replace: true })
    setShowListOnMobile(false)
  }

  function backToList() { setShowListOnMobile(true) }

  function startNew() {
    setSelectedId(null)
    setForm(empty)
    setMode('edit')
    setParams({}, { replace: true })
    setShowListOnMobile(false)
  }

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function saveForm() {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    try {
      setSaving(true)
      const payload = {
        title: form.title.trim(),
        category: form.category,
        document_type: form.document_type,
        description: form.description || null,
        content: form.content || null,
        file_link: form.file_link || null,
        client_id: form.client_id || null,
        listing_id: form.listing_id || null,
        status: form.status
      }
      if (selectedId) {
        await updateDocument(selectedId, payload)
        toast.success('Document updated')
      } else {
        const created = await addDocument(payload)
        if (created?.id) {
          setSelectedId(created.id)
          setParams({ id: created.id }, { replace: true })
        }
        toast.success('Document created')
      }
      setMode('view')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteDocument(deleting.id)
      if (deleting.id === selectedId) setSelectedId(null)
      toast.success('Document deleted')
    } catch (err) { toast.error(err.message) }
  }

  const clientById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients])
  const listingById = useMemo(() => Object.fromEntries(listings.map(l => [l.id, l])), [listings])

  return (
    <>
      <Topbar
        title="Document Vault"
        subtitle="Templates, contracts, disclosures, and resources — always ready"
        onMenuClick={openSidebar}
        actions={
          <Button size="sm" onClick={startNew}><Plus className="w-4 h-4" /> Add document</Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List panel */}
        <div className={`lg:col-span-1 ${showListOnMobile ? '' : 'hidden lg:block'}`}>
          <Card padding="p-0" className="lg:sticky lg:top-4">
            <div className="p-3 border-b-hairline border-line space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border-hairline border-line rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="All">All categories</option>
                {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>

            <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-sm text-ink-muted">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-ink-muted">
                  {documents.length === 0 ? 'No documents yet.' : 'No documents match your filters.'}
                </div>
              ) : (
                <div className="divide-y-hairline divide-line">
                  {filtered.map(d => (
                    <button
                      key={d.id}
                      onClick={() => openDoc(d.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-canvas/40 transition-colors ${selectedId === d.id ? 'bg-canvas border-l-2 border-l-brand' : ''}`}
                    >
                      <div className="text-sm font-medium truncate">{d.title}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {d.category && (
                          <span className="text-[10px] bg-canvas border-hairline border-line text-ink-muted px-1.5 py-0.5 rounded-full">{d.category}</span>
                        )}
                        {d.document_type && (
                          <span className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">{d.document_type}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Detail panel */}
        <div className={`lg:col-span-2 ${showListOnMobile ? 'hidden lg:block' : ''}`}>
          {!selected && mode !== 'edit' ? (
            <Card>
              <EmptyState
                icon={FileText}
                title={documents.length === 0 ? 'No documents yet' : 'Pick a document or add a new one'}
                description={documents.length === 0
                  ? 'Add your first template or checklist to build your document library.'
                  : 'Select a document from the list to view or edit it.'}
                action={<Button onClick={startNew}><Plus className="w-4 h-4" /> Add document</Button>}
              />
            </Card>
          ) : (
            <Card padding="p-0">
              <button
                onClick={backToList}
                className="lg:hidden flex items-center gap-1 text-sm text-ink-muted hover:text-ink px-5 pt-4"
              >
                <ArrowLeft className="w-4 h-4" /> Back to list
              </button>

              {mode === 'view' && selected ? (
                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-semibold leading-tight">{selected.title}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                        {selected.category && (
                          <span className="text-xs bg-canvas border-hairline border-line text-ink px-2 py-0.5 rounded-full">{selected.category}</span>
                        )}
                        {selected.document_type && (
                          <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">{selected.document_type}</span>
                        )}
                        <Badge value={selected.status || 'Active'} />
                      </div>
                      {(selected.client_id || selected.listing_id) && (
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-ink-muted">
                          {selected.client_id && clientById[selected.client_id] && (
                            <span className="bg-canvas px-2 py-0.5 rounded-full">
                              Client: {clientById[selected.client_id].name}
                            </span>
                          )}
                          {selected.listing_id && listingById[selected.listing_id] && (
                            <span className="bg-canvas px-2 py-0.5 rounded-full">
                              Listing: {listingById[selected.listing_id].property_address || listingById[selected.listing_id].name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-canvas rounded-btn" onClick={() => setMode('edit')} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-canvas rounded-btn" onClick={() => setDeleting(selected)} title="Delete">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {selected.file_link && (
                    <div className="mt-4">
                      <a href={selected.file_link} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-4 h-4" /> Open file
                        </Button>
                      </a>
                    </div>
                  )}

                  {selected.description && (
                    <div className="mt-4">
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-2">Description</div>
                      <div className="text-sm whitespace-pre-wrap">{selected.description}</div>
                    </div>
                  )}

                  {selected.content && (
                    <div className="mt-5">
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-2">Content</div>
                      <pre className="text-sm whitespace-pre-wrap font-sans bg-canvas/40 border-hairline border-line rounded-card p-4">
                        {selected.content}
                      </pre>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t-hairline border-line text-xs text-ink-muted">
                    Last updated {formatDate(selected.updated_at || selected.created_at)}
                  </div>
                </div>
              ) : (
                /* EDIT MODE */
                <div className="p-5 md:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold">{selectedId ? 'Edit document' : 'New document'}</h2>
                    <button
                      onClick={() => selectedId ? setMode('view') : setSelectedId(null)}
                      className="p-1.5 hover:bg-canvas rounded-btn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <Input
                    label="Title *"
                    required
                    placeholder='e.g. "Buyer rep agreement — standard"'
                    value={form.title}
                    onChange={(e) => setF('title', e.target.value)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select label="Category" value={form.category} onChange={(e) => setF('category', e.target.value)} options={DOCUMENT_CATEGORIES} />
                    <Select label="Type" value={form.document_type} onChange={(e) => setF('document_type', e.target.value)} options={DOCUMENT_TYPES} />
                    <Select label="Client (optional)" value={form.client_id || ''} onChange={(e) => setF('client_id', e.target.value)}>
                      <option value="">— None —</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Select label="Listing (optional)" value={form.listing_id || ''} onChange={(e) => setF('listing_id', e.target.value)}>
                      <option value="">— None —</option>
                      {listings.map(l => <option key={l.id} value={l.id}>{l.property_address || l.name}</option>)}
                    </Select>
                  </div>

                  <Input
                    label="File link (optional)"
                    type="url"
                    placeholder="https://drive.google.com/…"
                    value={form.file_link}
                    onChange={(e) => setF('file_link', e.target.value)}
                    hint="Paste a Drive, Dropbox, or DocuSign link if this doc lives outside the OS."
                  />

                  <Textarea
                    label="Description"
                    rows={2}
                    placeholder="When and why this document is used"
                    value={form.description}
                    onChange={(e) => setF('description', e.target.value)}
                  />

                  <Textarea
                    label="Content"
                    rows={10}
                    placeholder="Paste template text, checklist items, or notes…"
                    value={form.content}
                    onChange={(e) => setF('content', e.target.value)}
                  />

                  <Select label="Status" value={form.status} onChange={(e) => setF('status', e.target.value)} options={['Active', 'Archived']} />

                  <div className="flex items-center justify-end gap-2 pt-2 border-t-hairline border-line">
                    {selectedId && (
                      <Button variant="outline" onClick={() => setMode('view')} disabled={saving}>Cancel</Button>
                    )}
                    <Button onClick={saveForm} loading={saving}>
                      <Save className="w-4 h-4" /> Save document
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <ConfirmDelete
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        itemName={deleting?.title || 'document'}
      />
    </>
  )
}
