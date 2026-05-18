import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Eye, EyeOff, ShieldAlert, Check, Palette, Home, User } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input, { Textarea } from '../components/ui/Input'
import Select from '../components/ui/Select'
import ConfirmDelete from '../components/ui/ConfirmDelete'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from '../lib/toast'
import { COLOR_PRESETS, DEFAULT_BRAND, DEFAULT_ACCENT, applyTheme } from '../lib/theme'
import { SPECIALTIES } from '../lib/realtorConstants'
import LogoUpload from '../components/LogoUpload'

const SHOWING_PLATFORMS = ['ShowingTime', 'Calendly', 'Manual', 'Other']

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Berlin',
  'Australia/Sydney'
]

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'agent',   label: 'Agent profile', icon: Home },
  { key: 'brand',   label: 'Brand', icon: Palette },
  { key: 'account', label: 'Account', icon: ShieldAlert }
]

function maskKey(k) {
  if (!k) return '—'
  const parts = k.split('-')
  if (parts.length < 3) return k
  parts[parts.length - 2] = '••••'
  return parts.join('-')
}

function parseSpecialties(v) {
  if (!v) return []
  return String(v).split(/\s*[,;]\s*/).filter(Boolean)
}

function stringifySpecialties(arr) {
  return (arr || []).join(', ')
}

export default function Settings() {
  const { openSidebar } = useOutletContext()
  const { user, profile, refreshProfile, updateTheme } = useAuth()

  const [tab, setTab] = useState('profile')

  // Profile (basic)
  const [fullName, setFullName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Agent profile
  const [licenseNumber, setLicenseNumber] = useState('')
  const [brokerageName, setBrokerageName] = useState('')
  const [brokerageAddress, setBrokerageAddress] = useState('')
  const [licenseState, setLicenseState] = useState('')
  const [defaultCommissionRate, setDefaultCommissionRate] = useState(3.0)
  const [defaultBrokerageSplit, setDefaultBrokerageSplit] = useState(70)
  const [specialties, setSpecialties] = useState([])
  const [serviceAreas, setServiceAreas] = useState('')
  const [timezone, setTimezone] = useState('')
  const [preferredShowingPlatform, setPreferredShowingPlatform] = useState('')
  const [primaryMarketArea, setPrimaryMarketArea] = useState('')
  const [savingAgent, setSavingAgent] = useState(false)

  // Brand/theme
  const [brand, setBrand] = useState(DEFAULT_BRAND)
  const [accent, setAccent] = useState(DEFAULT_ACCENT)
  const [savingTheme, setSavingTheme] = useState(false)

  // Account
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [purgeOpen, setPurgeOpen] = useState(false)
  const [purging, setPurging] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setLicenseNumber(profile.license_number || '')
      setBrokerageName(profile.brokerage_name || '')
      setBrokerageAddress(profile.brokerage_address || '')
      setLicenseState(profile.license_state || '')
      setDefaultCommissionRate(profile.default_commission_rate ?? 3.0)
      setDefaultBrokerageSplit(profile.default_brokerage_split ?? 70)
      setSpecialties(parseSpecialties(profile.specialties))
      setServiceAreas(profile.service_areas || '')
      setTimezone(profile.timezone || '')
      setPreferredShowingPlatform(profile.preferred_showing_platform || '')
      setPrimaryMarketArea(profile.primary_market_area || '')
      setBrand(profile.brand_color || DEFAULT_BRAND)
      setAccent(profile.accent_color || DEFAULT_ACCENT)
    }
  }, [profile])

  useEffect(() => {
    applyTheme({ brand, accent })
  }, [brand, accent])

  function toggleSpecialty(name) {
    setSpecialties(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name])
  }

  async function saveProfile() {
    try {
      setSavingProfile(true)
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Profile updated')
    } catch (err) { toast.error(err.message) }
    finally { setSavingProfile(false) }
  }

  async function saveAgent() {
    try {
      setSavingAgent(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          license_number: licenseNumber || null,
          brokerage_name: brokerageName || null,
          brokerage_address: brokerageAddress || null,
          license_state: licenseState || null,
          default_commission_rate: Number(defaultCommissionRate) || 0,
          default_brokerage_split: Number(defaultBrokerageSplit) || 0,
          specialties: stringifySpecialties(specialties),
          service_areas: serviceAreas || null,
          timezone: timezone || null,
          preferred_showing_platform: preferredShowingPlatform || null,
          primary_market_area: primaryMarketArea || null
        })
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Agent profile saved')
    } catch (err) { toast.error(err.message) }
    finally { setSavingAgent(false) }
  }

  async function changePassword(e) {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    try {
      setChangingPw(true)
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      toast.success('Password updated')
    } catch (err) { toast.error(err.message) }
    finally { setChangingPw(false) }
  }

  async function saveTheme() {
    try {
      setSavingTheme(true)
      await updateTheme({ brand, accent })
      toast.success('Theme saved')
    } catch (err) { toast.error(err.message) }
    finally { setSavingTheme(false) }
  }

  function applyPreset(p) {
    setBrand(p.brand)
    setAccent(p.accent)
  }

  function resetTheme() {
    setBrand(DEFAULT_BRAND)
    setAccent(DEFAULT_ACCENT)
  }

  async function purgeAllData() {
    try {
      setPurging(true)
      const tables = [
        'follow_ups', 'tasks', 'invoices', 'documents',
        'showings', 'open_houses', 'transactions', 'leads',
        'market_notes', 'projects', 'clients', 'weekly_reviews'
      ]
      for (const t of tables) {
        const { error } = await supabase.from(t).delete().eq('user_id', user.id)
        if (error) throw error
      }
      toast.success('All your data has been deleted')
    } catch (err) { toast.error(err.message) }
    finally { setPurging(false) }
  }

  const themeDirty =
    brand !== (profile?.brand_color || DEFAULT_BRAND) ||
    accent !== (profile?.accent_color || DEFAULT_ACCENT)

  return (
    <>
      <Topbar
        title="Settings"
        subtitle="Manage your account, brokerage, and brand"
        onMenuClick={openSidebar}
      />

      {/* Tabs */}
      <div className="mb-5">
        <div className="flex items-center gap-1 bg-white border-hairline border-line rounded-btn p-1 overflow-x-auto w-fit">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-sm rounded-btn whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  active ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-4 max-w-3xl">
        {tab === 'profile' && (
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-medium">Account profile</h3>
            </div>
            <p className="text-xs text-ink-muted mb-4">Your name and email — the basics.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Email" value={user?.email || ''} disabled />
              <Input label="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveProfile} loading={savingProfile}>Save profile</Button>
            </div>
          </Card>
        )}

        {tab === 'agent' && (
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-medium">Agent profile</h3>
            </div>
            <p className="text-xs text-ink-muted mb-4">
              These defaults pre-fill across the app — commissions, listings, and onboarding.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="License number"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. SL3458921"
              />
              <Input
                label="License state"
                value={licenseState}
                onChange={(e) => setLicenseState(e.target.value)}
                placeholder="e.g. FL"
              />
              <Input
                label="Brokerage name"
                value={brokerageName}
                onChange={(e) => setBrokerageName(e.target.value)}
              />
              <Input
                label="Brokerage address"
                value={brokerageAddress}
                onChange={(e) => setBrokerageAddress(e.target.value)}
              />
              <Input
                label="Default commission rate (%)"
                type="number"
                min="0"
                step="0.1"
                value={defaultCommissionRate}
                onChange={(e) => setDefaultCommissionRate(e.target.value)}
                hint="Your standard listing-side rate."
              />
              <Input
                label="Brokerage split (% you keep)"
                type="number"
                min="0"
                max="100"
                step="1"
                value={defaultBrokerageSplit}
                onChange={(e) => setDefaultBrokerageSplit(e.target.value)}
                hint="Percent of gross commission you take home."
              />
              <Select
                label="Time zone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="">Select…</option>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </Select>
              <Select
                label="Preferred showing platform"
                value={preferredShowingPlatform}
                onChange={(e) => setPreferredShowingPlatform(e.target.value)}
              >
                <option value="">Select…</option>
                {SHOWING_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
              <Input
                label="Primary market area"
                className="md:col-span-2"
                value={primaryMarketArea}
                onChange={(e) => setPrimaryMarketArea(e.target.value)}
                placeholder="e.g. South Tampa / Hyde Park / Davis Islands"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-2">Specialties</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SPECIALTIES.map(s => {
                    const active = specialties.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialty(s)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-btn border-hairline text-left text-sm transition-colors
                          ${active ? 'border-brand bg-brand/5 text-brand' : 'border-line hover:bg-canvas/50'}`}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                        <span className="flex-1 truncate">{s}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <Textarea
                label="Service areas"
                className="md:col-span-2"
                rows={3}
                value={serviceAreas}
                onChange={(e) => setServiceAreas(e.target.value)}
                placeholder="Zip codes, neighborhoods, or cities you cover."
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveAgent} loading={savingAgent}>Save agent profile</Button>
            </div>
          </Card>
        )}

        {tab === 'brand' && (
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-medium">Brand & theme</h3>
            </div>
            <p className="text-xs text-ink-muted mb-4">
              Upload your logo and pick colors that match your brand. Changes preview live; click Save to keep them.
            </p>

            {/* Logo */}
            <div className="pb-4 mb-4 border-b-hairline border-line">
              <LogoUpload />
            </div>

            {/* Presets */}
            <div className="mb-4">
              <div className="text-xs font-medium text-ink-muted mb-2 uppercase tracking-wide">Presets</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {COLOR_PRESETS.map(p => {
                  const active = p.brand === brand && p.accent === accent
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-btn border-hairline text-left text-sm transition-colors
                        ${active ? 'border-ink bg-canvas' : 'border-line hover:bg-canvas/50'}`}
                    >
                      <div className="flex -space-x-1">
                        <span className="w-4 h-4 rounded-full border border-white" style={{ background: p.brand }} />
                        <span className="w-4 h-4 rounded-full border border-white" style={{ background: p.accent }} />
                      </div>
                      <span className="flex-1 truncate">{p.name}</span>
                      {active && <Check className="w-3.5 h-3.5 text-ink" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Brand color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-12 h-9 rounded-btn border-hairline border-line cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm font-mono bg-white border-hairline border-line rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Accent color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="w-12 h-9 rounded-btn border-hairline border-line cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm font-mono bg-white border-hairline border-line rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={resetTheme}>Reset to default</Button>
              <Button onClick={saveTheme} loading={savingTheme} disabled={!themeDirty}>Save theme</Button>
            </div>
          </Card>
        )}

        {tab === 'account' && (
          <>
            {/* Password */}
            <Card>
              <h3 className="text-sm font-medium mb-4">Change password</h3>
              <form onSubmit={changePassword} className="space-y-3">
                <div className="relative">
                  <Input
                    label="New password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-[34px] text-ink-muted hover:text-ink"
                    aria-label="Toggle visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" loading={changingPw} disabled={!newPassword}>Update password</Button>
                </div>
              </form>
            </Card>

            {/* License key */}
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium">License key</h3>
                  <p className="text-xs text-ink-muted mt-1">This is the key that activated your account.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowKey(s => !s)}>
                  {showKey ? 'Hide' : 'Reveal'}
                </Button>
              </div>
              <div className="mt-3 px-3 py-2 bg-canvas rounded-btn font-mono text-sm">
                {profile?.license_key
                  ? (showKey ? profile.license_key : maskKey(profile.license_key))
                  : '—'
                }
              </div>
            </Card>

            {/* Danger zone */}
            <Card className="border-red-200">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-900">Danger zone</h3>
                  <p className="text-xs text-ink-muted mt-1 mb-3">
                    Permanently delete every client, listing, deal, document, showing, and follow-up from your account.
                    Your login stays active.
                  </p>
                  <Button variant="danger" size="sm" onClick={() => setPurgeOpen(true)}>
                    Delete all data
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <ConfirmDelete
        open={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        onConfirm={purgeAllData}
        title="Delete all your data"
        itemName="all data"
      />
    </>
  )
}
