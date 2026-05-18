import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { toast } from '../../lib/toast'

export default function RedeemKey() {
  const navigate = useNavigate()
  const [licenseKey, setLicenseKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const trimmed = licenseKey.trim().toUpperCase()
      const { data, error } = await supabase
        .from('license_keys')
        .select('used')
        .eq('key', trimmed)
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('We could not find that license key')
      if (data.used) throw new Error('This license key has already been redeemed')

      navigate(`/signup?key=${encodeURIComponent(trimmed)}`)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Redeem your license"
      subtitle="Got a license key? Redeem it to activate your Realtor OS."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="License key"
          autoFocus
          required
          placeholder="FLOW-XXXX-XXXX-XXXX"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Continue
        </Button>
      </form>
      <div className="mt-6 text-sm text-ink-muted text-center">
        Already redeemed? <Link to="/login" className="text-ink hover:underline">Sign in</Link>
      </div>
    </AuthShell>
  )
}
