import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthShell from './AuthShell'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { toast } from '../../lib/toast'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [fullName, setFullName] = useState('')
  const [brokerageName, setBrokerageName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const k = params.get('key')
    if (k) setLicenseKey(k.toUpperCase())
  }, [params])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        brokerageName: brokerageName.trim(),
        licenseKey: licenseKey.trim().toUpperCase()
      })
      toast.success('Account created. Welcome to your Realtor OS!')
      navigate('/')
    } catch (err) {
      const msg = err.message || 'Could not create your Realtor OS account'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Activate your Realtor OS">
      <form onSubmit={handleSubmit} className="space-y-4">
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
        />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          required
          minLength={6}
          hint="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="License key"
          required
          placeholder="FLOW-XXXX-XXXX-XXXX"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
      <div className="mt-6 text-sm text-ink-muted text-center">
        Already have an account? <Link to="/login" className="text-ink hover:underline">Sign in</Link>
      </div>
    </AuthShell>
  )
}
