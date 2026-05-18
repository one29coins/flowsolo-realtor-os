import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, ClipboardList } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input, { Textarea } from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { useWeeklyReviews } from '../hooks/useWeeklyReviews'
import { startOfWeek, endOfWeek, toISODate, formatDate, formatCurrency } from '../lib/format'
import { toast } from '../lib/toast'

function shiftWeek(date, weeks) {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

const emptyForm = {
  // By the numbers
  new_listings: 0,
  showings_given: 0,
  open_houses_held: 0,
  new_leads: 0,
  offers_written: 0,
  offers_accepted: 0,
  closings_this_week: 0,
  gross_commission_week: 0,
  // Pipeline health
  listings_expiring_soon: '',
  buyers_needing_attention: '',
  leads_to_follow_up: '',
  deals_at_risk: '',
  // Your business
  top_win: '',
  top_challenge: '',
  prospecting_done: '',
  marketing_done: '',
  // Next week plan
  top_priority_1: '',
  top_priority_2: '',
  top_priority_3: '',
  listings_to_follow_up: '',
  buyers_to_check_in: '',
  open_houses_to_prep: '',
  prospecting_plan: '',
  // Ratings
  momentum_rating: 3,
  prospecting_rating: 3,
  business_rating: 3,
  energy_rating: 3,
  notes: ''
}

function StarRow({ value, onChange, leftLabel, rightLabel }) {
  return (
    <div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-0.5"
            aria-label={`${n} stars`}
          >
            <Star className={`w-5 h-5 ${n <= Number(value) ? 'text-amber-400 fill-amber-400' : 'text-line'}`} />
          </button>
        ))}
      </div>
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-[10px] text-ink-muted mt-1 uppercase tracking-wide">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  )
}

export default function WeeklyReview() {
  const { openSidebar } = useOutletContext()
  const hookResult = useWeeklyReviews()
  // Accept either contract: { reviews, addReview, updateReview } or { reviews, upsertReview }
  const reviews = hookResult.reviews || []
  const loading = !!hookResult.loading
  const upsertReview = hookResult.upsertReview || (async (payload) => {
    const existing = reviews.find(r => r.week_start === payload.week_start)
    if (existing && hookResult.updateReview) return hookResult.updateReview(existing.id, payload)
    if (hookResult.addReview) return hookResult.addReview(payload)
  })

  const [weekDate, setWeekDate] = useState(startOfWeek())
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const weekStartISO = useMemo(() => toISODate(startOfWeek(weekDate)), [weekDate])
  const weekEnd = useMemo(() => endOfWeek(weekDate), [weekDate])

  useEffect(() => {
    const existing = reviews.find(r => r.week_start === weekStartISO)
    if (existing) {
      setForm({
        new_listings: existing.new_listings || 0,
        showings_given: existing.showings_given || 0,
        open_houses_held: existing.open_houses_held || 0,
        new_leads: existing.new_leads || 0,
        offers_written: existing.offers_written || 0,
        offers_accepted: existing.offers_accepted || 0,
        closings_this_week: existing.closings_this_week || 0,
        gross_commission_week: existing.gross_commission_week || 0,
        listings_expiring_soon: existing.listings_expiring_soon || '',
        buyers_needing_attention: existing.buyers_needing_attention || '',
        leads_to_follow_up: existing.leads_to_follow_up || '',
        deals_at_risk: existing.deals_at_risk || '',
        top_win: existing.top_win || '',
        top_challenge: existing.top_challenge || '',
        prospecting_done: existing.prospecting_done || '',
        marketing_done: existing.marketing_done || '',
        top_priority_1: existing.top_priority_1 || '',
        top_priority_2: existing.top_priority_2 || '',
        top_priority_3: existing.top_priority_3 || '',
        listings_to_follow_up: existing.listings_to_follow_up || '',
        buyers_to_check_in: existing.buyers_to_check_in || '',
        open_houses_to_prep: existing.open_houses_to_prep || '',
        prospecting_plan: existing.prospecting_plan || '',
        momentum_rating: existing.momentum_rating || 3,
        prospecting_rating: existing.prospecting_rating || 3,
        business_rating: existing.business_rating || 3,
        energy_rating: existing.energy_rating || 3,
        notes: existing.notes || ''
      })
    } else {
      setForm(emptyForm)
    }
  }, [weekStartISO, reviews])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave() {
    try {
      setSaving(true)
      const payload = {
        week_start: weekStartISO,
        new_listings: Number(form.new_listings) || 0,
        showings_given: Number(form.showings_given) || 0,
        open_houses_held: Number(form.open_houses_held) || 0,
        new_leads: Number(form.new_leads) || 0,
        offers_written: Number(form.offers_written) || 0,
        offers_accepted: Number(form.offers_accepted) || 0,
        closings_this_week: Number(form.closings_this_week) || 0,
        gross_commission_week: Number(form.gross_commission_week) || 0,
        listings_expiring_soon: form.listings_expiring_soon,
        buyers_needing_attention: form.buyers_needing_attention,
        leads_to_follow_up: form.leads_to_follow_up,
        deals_at_risk: form.deals_at_risk,
        top_win: form.top_win,
        top_challenge: form.top_challenge,
        prospecting_done: form.prospecting_done,
        marketing_done: form.marketing_done,
        top_priority_1: form.top_priority_1,
        top_priority_2: form.top_priority_2,
        top_priority_3: form.top_priority_3,
        listings_to_follow_up: form.listings_to_follow_up,
        buyers_to_check_in: form.buyers_to_check_in,
        open_houses_to_prep: form.open_houses_to_prep,
        prospecting_plan: form.prospecting_plan,
        momentum_rating: Number(form.momentum_rating) || 3,
        prospecting_rating: Number(form.prospecting_rating) || 3,
        business_rating: Number(form.business_rating) || 3,
        energy_rating: Number(form.energy_rating) || 3,
        notes: form.notes
      }
      await upsertReview(payload)
      toast.success('Weekly review saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const recent = reviews.slice(0, 8)
  const hasCurrent = !!reviews.find(r => r.week_start === weekStartISO)

  return (
    <>
      <Topbar
        title="Weekly Business Review"
        subtitle="Reflect on your week and plan your next move"
        onMenuClick={openSidebar}
      />

      {/* Week selector */}
      <Card className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setWeekDate(d => shiftWeek(d, -1))}
          className="p-2 hover:bg-canvas rounded-btn"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="text-sm text-ink-muted">Week of</div>
          <div className="font-medium">
            {formatDate(weekStartISO)} — {formatDate(toISODate(weekEnd))}
          </div>
        </div>
        <button
          onClick={() => setWeekDate(d => shiftWeek(d, 1))}
          className="p-2 hover:bg-canvas rounded-btn"
          aria-label="Next week"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </Card>

      {/* By the numbers */}
      <Card className="mb-4">
        <h3 className="text-sm font-medium mb-1">This week by the numbers</h3>
        <p className="text-xs text-ink-muted mb-4">The hard facts of your week.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="New listings" type="number" min="0" step="1"
            value={form.new_listings} onChange={(e) => set('new_listings', e.target.value)} />
          <Input label="Showings given" type="number" min="0" step="1"
            value={form.showings_given} onChange={(e) => set('showings_given', e.target.value)} />
          <Input label="Open houses held" type="number" min="0" step="1"
            value={form.open_houses_held} onChange={(e) => set('open_houses_held', e.target.value)} />
          <Input label="New leads" type="number" min="0" step="1"
            value={form.new_leads} onChange={(e) => set('new_leads', e.target.value)} />
          <Input label="Offers written" type="number" min="0" step="1"
            value={form.offers_written} onChange={(e) => set('offers_written', e.target.value)} />
          <Input label="Offers accepted" type="number" min="0" step="1"
            value={form.offers_accepted} onChange={(e) => set('offers_accepted', e.target.value)} />
          <Input label="Closings" type="number" min="0" step="1"
            value={form.closings_this_week} onChange={(e) => set('closings_this_week', e.target.value)} />
          <Input label="Gross commission ($)" type="number" min="0" step="0.01"
            value={form.gross_commission_week} onChange={(e) => set('gross_commission_week', e.target.value)} />
        </div>
      </Card>

      {/* Pipeline health */}
      <Card className="mb-4">
        <h3 className="text-sm font-medium mb-1">Pipeline health</h3>
        <p className="text-xs text-ink-muted mb-4">Where is your business sitting right now?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea label="Listings expiring soon" rows={3}
            value={form.listings_expiring_soon}
            onChange={(e) => set('listings_expiring_soon', e.target.value)}
            placeholder="Which listings need attention before they expire?" />
          <Textarea label="Buyers needing attention" rows={3}
            value={form.buyers_needing_attention}
            onChange={(e) => set('buyers_needing_attention', e.target.value)}
            placeholder="Which buyers have gone quiet or need a nudge?" />
          <Textarea label="Leads to follow up" rows={3}
            value={form.leads_to_follow_up}
            onChange={(e) => set('leads_to_follow_up', e.target.value)}
            placeholder="New leads still waiting for a real conversation" />
          <Textarea label="Deals at risk" rows={3}
            value={form.deals_at_risk}
            onChange={(e) => set('deals_at_risk', e.target.value)}
            placeholder="Inspection issues, financing problems, cold feet…" />
        </div>
      </Card>

      {/* Your business */}
      <Card className="mb-4">
        <h3 className="text-sm font-medium mb-1">Your business</h3>
        <p className="text-xs text-ink-muted mb-4">Reflect on what worked and what didn't.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Top win" value={form.top_win} onChange={(e) => set('top_win', e.target.value)} placeholder="What was the highlight of the week?" />
          <Input label="Top challenge" value={form.top_challenge} onChange={(e) => set('top_challenge', e.target.value)} placeholder="What got in the way?" />
          <Textarea label="Prospecting done" rows={3}
            value={form.prospecting_done}
            onChange={(e) => set('prospecting_done', e.target.value)}
            placeholder="Calls, door-knocks, SOI touches, lead-gen activity" />
          <Textarea label="Marketing done" rows={3}
            value={form.marketing_done}
            onChange={(e) => set('marketing_done', e.target.value)}
            placeholder="Listings posted, social content, email blasts" />
        </div>
      </Card>

      {/* Next week plan */}
      <Card className="mb-4">
        <h3 className="text-sm font-medium mb-1">Next week plan</h3>
        <p className="text-xs text-ink-muted mb-4">Top 3 priorities and who needs proactive outreach.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Input label="Priority 1" value={form.top_priority_1} onChange={(e) => set('top_priority_1', e.target.value)} />
          <Input label="Priority 2" value={form.top_priority_2} onChange={(e) => set('top_priority_2', e.target.value)} />
          <Input label="Priority 3" value={form.top_priority_3} onChange={(e) => set('top_priority_3', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea label="Listings to follow up on" rows={3}
            value={form.listings_to_follow_up}
            onChange={(e) => set('listings_to_follow_up', e.target.value)} />
          <Textarea label="Buyers to check in with" rows={3}
            value={form.buyers_to_check_in}
            onChange={(e) => set('buyers_to_check_in', e.target.value)} />
          <Textarea label="Open houses to prep" rows={3}
            value={form.open_houses_to_prep}
            onChange={(e) => set('open_houses_to_prep', e.target.value)} />
          <Textarea label="Prospecting plan" rows={3}
            value={form.prospecting_plan}
            onChange={(e) => set('prospecting_plan', e.target.value)}
            placeholder="How will you generate new business?" />
        </div>
      </Card>

      {/* Ratings */}
      <Card className="mb-4">
        <h3 className="text-sm font-medium mb-1">How did this week feel?</h3>
        <p className="text-xs text-ink-muted mb-4">A snapshot of your business and energy.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Momentum</label>
            <StarRow value={form.momentum_rating} onChange={(v) => set('momentum_rating', v)}
              leftLabel="Stalled" rightLabel="Surging" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Prospecting</label>
            <StarRow value={form.prospecting_rating} onChange={(v) => set('prospecting_rating', v)}
              leftLabel="Quiet" rightLabel="On fire" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Business health</label>
            <StarRow value={form.business_rating} onChange={(v) => set('business_rating', v)}
              leftLabel="Struggling" rightLabel="Thriving" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Energy</label>
            <StarRow value={form.energy_rating} onChange={(v) => set('energy_rating', v)}
              leftLabel="Drained" rightLabel="Energized" />
          </div>
        </div>

        <Textarea
          className="mt-5"
          label="Anything else worth remembering?"
          rows={2}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            {hasCurrent ? 'Update weekly review' : 'Save weekly review'}
          </Button>
        </div>
      </Card>

      {/* History */}
      <Card padding="p-0">
        <div className="px-5 py-4 border-b-hairline border-line">
          <h3 className="text-sm font-medium">Last 8 weeks</h3>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-ink-muted">Loading…</div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No reviews yet"
            description="Complete your first Weekly Business Review this Friday."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
            {recent.map(r => {
              const isOpen = expanded === r.id
              const closings = Number(r.closings_this_week || 0)
              const gci = Number(r.gross_commission_week || 0)
              return (
                <div
                  key={r.id}
                  className="border-hairline border-line rounded-card p-4 hover:bg-canvas/30 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">{formatDate(r.week_start)}</div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star
                          key={n}
                          className={`w-3.5 h-3.5 ${n <= (r.momentum_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-line'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-ink-muted">
                    {closings} closing{closings === 1 ? '' : 's'} · {formatCurrency(gci)} GCI · {r.showings_given || 0} showings · {r.new_leads || 0} new leads
                  </div>
                  {r.top_win && (
                    <div className={`mt-2 text-sm ${isOpen ? '' : 'line-clamp-2'} whitespace-pre-wrap`}>
                      <span className="text-ink-muted text-xs uppercase tracking-wide block mb-0.5">Top win</span>
                      {r.top_win}
                    </div>
                  )}
                  {isOpen && (
                    <div className="mt-3 space-y-2 text-sm">
                      {r.top_challenge && <Field label="Top challenge" value={r.top_challenge} />}
                      {r.deals_at_risk && <Field label="Deals at risk" value={r.deals_at_risk} />}
                      {(r.top_priority_1 || r.top_priority_2 || r.top_priority_3) && (
                        <Field
                          label="Next week priorities"
                          value={[r.top_priority_1, r.top_priority_2, r.top_priority_3].filter(Boolean).join('\n')}
                        />
                      )}
                      {r.prospecting_done && <Field label="Prospecting done" value={r.prospecting_done} />}
                      {r.notes && <Field label="Notes" value={r.notes} />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="whitespace-pre-wrap">{value}</div>
    </div>
  )
}
