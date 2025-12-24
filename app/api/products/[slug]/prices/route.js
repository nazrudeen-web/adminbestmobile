import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { slug, variantId } = params
    const searchParams = request.nextUrl.searchParams
    const storage = searchParams.get('storage')
    const color = searchParams.get('color')

    // Fetch product to get ID
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('slug', slug)
      .single()

    if (productError) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    let query = supabase
      .from('variant_prices_view')
      .select('*')
      .eq('product_id', product.id)

    // Filter by variant ID if provided
    if (variantId) {
      query = query.eq('variant_id', variantId)
    }

    // Filter by storage if provided
    if (storage) {
      query = query.eq('storage', storage)
    }

    // Filter by color if provided
    if (color) {
      query = query.eq('color', color)
    }

    query = query.order('price', { ascending: true })

    const { data: prices, error: pricesError } = await query

    if (pricesError) {
      return NextResponse.json(
        { error: 'Error fetching prices' },
        { status: 500 }
      )
    }

    // Calculate price statistics
    const priceStats = {
      lowest: prices.length > 0 ? Math.min(...prices.map(p => p.price)) : null,
      highest: prices.length > 0 ? Math.max(...prices.map(p => p.price)) : null,
      average: prices.length > 0 
        ? (prices.reduce((sum, p) => sum + parseFloat(p.price), 0) / prices.length).toFixed(2)
        : null,
      storeCount: new Set(prices.map(p => p.store_id)).size
    }

    const response = {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug
      },
      filters: {
        storage,
        color,
        variantId
      },
      statistics: priceStats,
      prices: prices.map(p => ({
        id: p.id,
        store: {
          id: p.store_id,
          name: p.store_name,
          logo: p.store_logo,
          websiteUrl: p.website_url,
          isOfficial: p.is_official,
          isAuthorized: p.is_authorized_seller
        },
        variant: {
          id: p.variant_id,
          storage: p.storage,
          color: p.color,
          colorHex: p.color_hex
        },
        price: parseFloat(p.price),
        oldPrice: p.old_price ? parseFloat(p.old_price) : null,
        discount: p.old_price 
          ? Math.round(((p.old_price - p.price) / p.old_price) * 100)
          : null,
        affiliateUrl: p.affiliate_url,
        updatedAt: p.updated_at
      }))
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in prices API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
