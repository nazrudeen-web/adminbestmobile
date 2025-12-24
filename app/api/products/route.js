import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Get all products for listing page
export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const brandSlug = searchParams.get('brand')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    let query = supabase
      .from('product_complete_view')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    // Filter by brand
    if (brandSlug) {
      query = query.eq('brand_slug', brandSlug)
    }

    // Search by name
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    query = query.range(offset, offset + limit - 1)

    const { data: products, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Error fetching products' },
        { status: 500 }
      )
    }

    const response = {
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: {
          name: p.brand_name,
          slug: p.brand_slug,
          logo: p.brand_logo
        },
        mainImage: p.main_image,
        badge: p.badge,
        bestPrice: p.best_price,
        expertScore: p.expert_score,
        launchYear: p.launch_year,
        storageOptions: p.variants 
          ? [...new Set(p.variants.map(v => v.storage))].filter(Boolean).sort()
          : []
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasMore: offset + limit < count
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in products list API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
