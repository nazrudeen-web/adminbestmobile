import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  try {
    const body = await req.json()
    const { bucket = 'products', imageUrl, fileName, productId } = body || {}

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return NextResponse.json({
        ok: false,
        error: 'Missing Supabase environment variables (URL or SERVICE ROLE KEY)'
      }, { status: 500 })
    }

    const admin = createClient(url, serviceKey)

    // Derive object path from public URL if available
    const marker = `/storage/v1/object/public/${bucket}/`
    let objectPath = null
    if (imageUrl && imageUrl.includes(marker)) {
      objectPath = imageUrl.substring(imageUrl.indexOf(marker) + marker.length)
    }

    // Try in order: objectPath, fileName, `${productId}/${fileName}`
    const tryRemove = async (path) => {
      if (!path) return { ok: false, error: 'no-path' }
      const { error } = await admin.storage.from(bucket).remove([path])
      if (error) {
        // treat not found as success
        if (String(error.message || '').toLowerCase().includes('not found')) {
          return { ok: true }
        }
        return { ok: false, error }
      }
      return { ok: true }
    }

    let result = await tryRemove(objectPath)
    if (!result.ok) {
      result = await tryRemove(fileName)
    }
    if (!result.ok) {
      result = await tryRemove(productId ? `${productId}/${fileName}` : null)
    }

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
