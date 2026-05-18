import { useState } from 'react'
import { Check, Building2, Users, Calendar, Home } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'
import Select from './ui/Select'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PROPERTY_TYPES, CLIENT_TYPES } from '../lib/realtorConstants'
import { toast } from '../lib/toast'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC'
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu'
]

const CLIENT_FOCUS_OPTIONS = ['Buyers', 'Sellers', 'Both']
const LISTING_STATUS_OPTIONS = ['Coming Soon', 'Active', 'Under Contract', 'Pending']
const CLIENT_TYPE_OPTIONS = CLIENT_TYPES // imported

export default function OnboardingWizard({ onDone }) {
  const { user, profile, refreshProfile } = useAuth()

  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)

  // Step 1
  const [fullName, setFullName]       = useState(profile?.full_name || '')
  const [brokerageName, setBrokerageName] = useState(profile?.brokerage_name || '')
  const [licenseState, setLicenseState]   = useState(profile?.license_state || '')
  const [timezone, setTimezone]           = useState(profile?.timezone || '')

  // Step 2
  const [commissionRate, setCommissionRate] = useState(profile?.default_commission_rate ?? 3.0)
  const [brokerageSplit, setBrokerageSplit] = useState(profile?.default_brokerage_split ?? 70)

  // Step 3
  const [primaryMarket, setPrimaryMarket] = useState(profile?.primary_market_area || '')
  const [propertyTypes, setPropertyTypes] = useState(() =>
    (profile?.property_type_focus || '').split(',').map(s => s.trim()).filter(Boolean)
  )
  const [clientFocus, setClientFocus] = useState(profile?.client_focus || 'Both')

  // Step 4
  const [quickType, setQuickType] = useState('listing') // 'listing' | 'client'
  const [listing, setListing] = useState({
    property_address: '',
    list_price: '',
    status: 'Active'
  })
  const [client, setClient] = useState({
    name: '',
    email: '',
    phone: '',
    client_type: 'Buyer'
  })

  function togglePropertyType(t) {
    setPropertyTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  async function goNextFromStep1() {
    if (!fullName.trim()) {
      toast.error('Add your name to continue')
      return
    }
    setStep(2)
  }

  async function goNextFromStep2() {
    setStep(3)
  }

  async function goNextFromStep3() {
    setStep(4)
  }

  async function saveStep4(skip = false) {
    try {
      setBusy(true)
      if (!skip) {
        if (quickType === 'listing' && listing.property_address.trim()) {
          const { error } = await supabase.from('projects').insert({
            user_id: user.id,
            name: listing.property_address.trim(),
            property_address: listing.property_address.trim(),
            list_price: Number(listing.list_price) || null,
            status: listing.status,
            commission_rate: Number(commissionRate) || 3.0
          })
          if (error) throw error
          toast.success('First listing added')
        } else if (quickType === 'client' && client.name.trim()) {
          const { error } = await supabase.from('clients').insert({
            user_id: user.id,
            name: client.name.trim(),
            email: client.email.trim() || null,
            phone: client.phone.trim() || null,
            client_type: client.client_type,
            priority: 'Medium'
          })
          if (error) throw error
          toast.success('First client added')
        }
      }
      setStep(5)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function finish() {
    try {
      setBusy(true)
      const payload = {
        full_name: fullName.trim(),
        brokerage_name: brokerageName.trim() || null,
        license_state: licenseState || null,
        timezone: timezone || null,
        default_commission_rate: Number(commissionRate) || 3.0,
        default_brokerage_split: Number(brokerageSplit) || 70,
        primary_market_area: primaryMarket.trim() || null,
        property_type_focus: propertyTypes.join(', ') || null,
        client_focus: clientFocus || null,
        onboarding_completed: true
      }
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      onDone?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const propertyTypeSummary = propertyTypes.length
    ? propertyTypes.join(', ')
    : 'No property focus selected'

  return (
    <Modal
      open
      onClose={() => {}}
      title={`Step ${step} of 5`}
      size="lg"
      footer={
        <>
          {step > 1 && step < 5 && (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={busy}>
              Back
            </Button>
          )}
          {step === 1 && (
            <Button onClick={goNextFromStep1} disabled={!fullName.trim() || busy}>Next</Button>
          )}
          {step === 2 && (
            <Button onClick={goNextFromStep2} disabled={busy}>Next</Button>
          )}
          {step === 3 && (
            <Button onClick={goNextFromStep3} disabled={busy}>Next</Button>
          )}
          {step === 4 && (
            <>
              <Button variant="outline" onClick={() => saveStep4(true)} disabled={busy}>
                Skip for now
              </Button>
              <Button
                onClick={() => saveStep4(false)}
                loading={busy}
                disabled={
                  quickType === 'listing'
                    ? !listing.property_address.trim()
                    : !client.name.trim()
                }
              >
                {quickType === 'listing' ? 'Add listing' : 'Add client'}
              </Button>
            </>
          )}
          {step === 5 && (
            <Button onClick={finish} loading={busy}>
              Go to my dashboard
            </Button>
          )}
        </>
      }
    >
      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-5 justify-center">
        {[1, 2, 3, 4, 5].map(n => (
          <div
            key={n}
            className={`h-1.5 rounded-full transition-all ${
              n === step ? 'w-8 bg-accent' : n < step ? 'w-2 bg-accent/60' : 'w-2 bg-line'
            }`}
          />
        ))}
      </div>

      {/* STEP 1 — Welcome / agent basics */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Welcome to your Realtor OS</h2>
            <p className="text-sm text-ink-muted mt-1">
              Let's get you set up in 90 seconds.
            </p>
          </div>
          <Input
            label="Full name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Brokerage name"
            placeholder="e.g., Keller Williams Austin"
            value={brokerageName}
            onChange={(e) => setBrokerageName(e.target.value)}
            hint="Shows in the sidebar and across the app"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="License state"
              value={licenseState}
              onChange={(e) => setLicenseState(e.target.value)}
            >
              <option value="">Select…</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select
              label="Time zone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="">Select…</option>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </Select>
          </div>
        </div>
      )}

      {/* STEP 2 — Commission defaults */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Set up your commission defaults</h2>
            <p className="text-sm text-ink-muted mt-1">
              These pre-fill every commission calculation throughout the app.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Default commission rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              inputMode="decimal"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              hint="Standard residential rate is 3.0%"
            />
            <Input
              label="Brokerage split (% you keep)"
              type="number"
              min="0"
              max="100"
              step="1"
              inputMode="decimal"
              value={brokerageSplit}
              onChange={(e) => setBrokerageSplit(e.target.value)}
              hint="70 means 70/30 in your favor"
            />
          </div>
        </div>
      )}

      {/* STEP 3 — Market focus */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">What markets do you serve?</h2>
            <p className="text-sm text-ink-muted mt-1">
              Helps surface the right reports and reminders for your business.
            </p>
          </div>
          <Input
            label="Primary market area"
            placeholder='e.g., "Austin metro" or "South Brooklyn"'
            value={primaryMarket}
            onChange={(e) => setPrimaryMarket(e.target.value)}
          />
          <div>
            <span className="block text-sm font-medium text-ink mb-2">Property type focus</span>
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map(t => {
                const active = propertyTypes.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => togglePropertyType(t)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-btn border-hairline text-left text-sm transition-colors
                      ${active
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-line hover:bg-canvas/50'}`}
                  >
                    {active
                      ? <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      : <span className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span className="truncate">{t}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium text-ink mb-2">Client focus</span>
            <div className="flex flex-wrap gap-2">
              {CLIENT_FOCUS_OPTIONS.map(opt => {
                const active = clientFocus === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setClientFocus(opt)}
                    className={`px-4 py-2 rounded-btn border-hairline text-sm transition-colors
                      ${active
                        ? 'border-accent bg-accent/10 text-accent font-medium'
                        : 'border-line hover:bg-canvas/50'}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — First listing or client (skippable) */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Add your first listing or client</h2>
            <p className="text-sm text-ink-muted mt-1">
              Pick whichever you have ready — you can always add more later.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setQuickType('listing')}
              className={`px-3 py-2 rounded-btn border-hairline text-sm flex items-center justify-center gap-2 transition-colors
                ${quickType === 'listing'
                  ? 'border-accent bg-accent/10 text-accent font-medium'
                  : 'border-line hover:bg-canvas/50'}`}
            >
              <Building2 className="w-4 h-4" />
              A listing
            </button>
            <button
              type="button"
              onClick={() => setQuickType('client')}
              className={`px-3 py-2 rounded-btn border-hairline text-sm flex items-center justify-center gap-2 transition-colors
                ${quickType === 'client'
                  ? 'border-accent bg-accent/10 text-accent font-medium'
                  : 'border-line hover:bg-canvas/50'}`}
            >
              <Users className="w-4 h-4" />
              A client
            </button>
          </div>

          {quickType === 'listing' ? (
            <div className="space-y-3">
              <Input
                label="Property address"
                placeholder="123 Main St, Austin TX"
                value={listing.property_address}
                onChange={(e) => setListing(l => ({ ...l, property_address: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="List price ($)"
                  type="number"
                  min="0"
                  step="1000"
                  inputMode="decimal"
                  value={listing.list_price}
                  onChange={(e) => setListing(l => ({ ...l, list_price: e.target.value }))}
                />
                <Select
                  label="Status"
                  value={listing.status}
                  onChange={(e) => setListing(l => ({ ...l, status: e.target.value }))}
                  options={LISTING_STATUS_OPTIONS}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                label="Client name"
                value={client.name}
                onChange={(e) => setClient(c => ({ ...c, name: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Email"
                  type="email"
                  value={client.email}
                  onChange={(e) => setClient(c => ({ ...c, email: e.target.value }))}
                />
                <Input
                  label="Phone"
                  value={client.phone}
                  onChange={(e) => setClient(c => ({ ...c, phone: e.target.value }))}
                />
              </div>
              <Select
                label="Client type"
                value={client.client_type}
                onChange={(e) => setClient(c => ({ ...c, client_type: e.target.value }))}
                options={CLIENT_TYPE_OPTIONS}
              />
            </div>
          )}
        </div>
      )}

      {/* STEP 5 — Done */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="text-center py-1">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <Home className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-lg font-semibold mt-3">You're all set! 🏡</h2>
            <p className="text-sm text-ink-muted mt-1">
              Your Realtor OS is configured. Here's what we captured.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <SummaryRow label="Agent">{fullName || '—'}</SummaryRow>
            <SummaryRow label="Brokerage">{brokerageName || '—'}</SummaryRow>
            <SummaryRow label="License state">{licenseState || '—'}</SummaryRow>
            <SummaryRow label="Time zone">{timezone || '—'}</SummaryRow>
            <SummaryRow label="Default commission">
              {Number(commissionRate) || 0}%
            </SummaryRow>
            <SummaryRow label="Brokerage split">
              You keep {Number(brokerageSplit) || 0}%
            </SummaryRow>
            <SummaryRow label="Primary market">{primaryMarket || '—'}</SummaryRow>
            <SummaryRow label="Client focus">{clientFocus || '—'}</SummaryRow>
          </div>
          <div className="text-xs text-ink-muted">
            Property focus: <span className="text-ink">{propertyTypeSummary}</span>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-ink-muted mb-2 mt-1">
              Suggested first actions
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Suggestion
                icon={Building2}
                title="Add your active listings"
                body="Pull in current inventory you're representing."
              />
              <Suggestion
                icon={Users}
                title="Log your current leads"
                body="Drop them into the pipeline by stage."
              />
              <Suggestion
                icon={Calendar}
                title="Set up your first open house"
                body="Capture sign-ins and auto-track follow-ups."
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function SummaryRow({ label, children }) {
  return (
    <div className="border-hairline border-line rounded-btn px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="text-sm font-medium text-ink truncate">{children}</div>
    </div>
  )
}

function Suggestion({ icon: Icon, title, body }) {
  return (
    <div className="border-hairline border-line rounded-card p-3 text-left">
      <Icon className="w-4 h-4 text-accent mb-2" />
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-ink-muted">{body}</div>
    </div>
  )
}
