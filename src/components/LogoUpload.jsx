import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from '../lib/toast'
import Button from './ui/Button'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export default function LogoUpload() {
  const { user, profile, refreshProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const fileRef = useRef(null)

  const currentUrl = profile?.logo_url || null

  async function handleFile(file) {
    if (!file) return
    if (!ALLOWED.includes(file.type)) {
      toast.error('Use PNG, JPG, WebP, or SVG')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image is too large (max 2 MB)')
      return
    }
    try {
      setUploading(true)
      // Use a timestamped path inside the user's folder so it bypasses the CDN cache on re-upload
      const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'png'
      const path = `${user.id}/logo-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('logos')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

      // Best-effort clean up the previous logo to avoid storage leaks
      if (currentUrl) {
        const prevPath = extractPathFromPublicUrl(currentUrl)
        if (prevPath) {
          await supabase.storage.from('logos').remove([prevPath]).catch(() => {})
        }
      }

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('id', user.id)
      if (profileErr) throw profileErr

      await refreshProfile()
      toast.success('Logo updated')
    } catch (err) {
      toast.error(err.message || 'Could not upload logo')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function removeLogo() {
    if (!currentUrl) return
    try {
      setRemoving(true)
      const prevPath = extractPathFromPublicUrl(currentUrl)
      if (prevPath) {
        await supabase.storage.from('logos').remove([prevPath]).catch(() => {})
      }
      const { error } = await supabase.from('profiles').update({ logo_url: null }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Logo removed')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-card border-hairline border-line flex items-center justify-center bg-canvas overflow-hidden flex-shrink-0">
        {currentUrl
          ? <img src={currentUrl} alt="Logo" className="w-full h-full object-contain" />
          : <ImageIcon className="w-6 h-6 text-ink-muted" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">Your brokerage logo</div>
        <div className="text-xs text-ink-muted">PNG, JPG, WebP, or SVG · 2 MB max · square works best</div>
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || removing}
          >
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
              : <><Upload className="w-4 h-4" /> {currentUrl ? 'Replace' : 'Upload'}</>
            }
          </Button>
          {currentUrl && (
            <Button size="sm" variant="ghost" onClick={removeLogo} disabled={uploading || removing}>
              <X className="w-4 h-4" /> Remove
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ALLOWED.join(',')}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  )
}

// "https://xxx.supabase.co/storage/v1/object/public/logos/<userId>/logo-...png" → "<userId>/logo-...png"
function extractPathFromPublicUrl(url) {
  if (!url) return null
  const marker = '/object/public/logos/'
  const i = url.indexOf(marker)
  if (i === -1) return null
  return url.slice(i + marker.length)
}
