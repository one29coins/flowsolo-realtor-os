// Run with: node scripts/generate-keys.js 50
// Generates N unique license keys and inserts them into Supabase.
//
// Requires SUPABASE_SERVICE_KEY in your .env (NEVER expose this in the frontend).
// Get it from: Supabase Dashboard → Project Settings → API → service_role key.

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY

if (!url || !serviceKey) {
  console.error('\nMissing env vars. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env\n')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false }
})

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid confusion

function segment(len = 4) {
  let s = ''
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return s
}

function generateKey() {
  return `REAL-${segment()}-${segment()}-${segment()}`
}

async function generateKeys(count) {
  // Generate locally with dedupe
  const seen = new Set()
  while (seen.size < count) seen.add(generateKey())
  const keys = Array.from(seen, key => ({ key, used: false }))

  const { data, error } = await supabase
    .from('license_keys')
    .insert(keys)
    .select('key')

  if (error) {
    console.error('Error inserting keys:', error.message)
    process.exit(1)
  }

  console.log(`\nGenerated ${data.length} license keys:\n`)
  data.forEach(k => console.log(k.key))
  console.log(`\nDone. Paste these into your sales delivery system.\n`)
}

const count = parseInt(process.argv[2], 10) || 10
if (!Number.isFinite(count) || count < 1 || count > 10000) {
  console.error('Pass a positive integer count (1–10000). Example: node scripts/generate-keys.js 100')
  process.exit(1)
}

generateKeys(count)
