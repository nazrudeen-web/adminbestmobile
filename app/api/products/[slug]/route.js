import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { slug } = params

    // Fetch complete product data from the view
    const { data: product, error: productError } = await supabase
      .from('product_complete_view')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (productError) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch prices for all variants from all stores
    const { data: prices, error: pricesError } = await supabase
      .from('variant_prices_view')
      .select('*')
      .eq('product_id', product.id)
      .order('price', { ascending: true })

    if (pricesError) {
      console.error('Error fetching prices:', pricesError)
    }

    // Fetch similar/related products
    const { data: relatedProducts, error: relatedError } = await supabase
      .from('related_products')
      .select(`
        id,
        type,
        related_product:related_product_id (
          id,
          name,
          slug,
          main_image,
          best_price,
          brand:brands (
            name,
            slug
          )
        )
      `)
      .eq('product_id', product.id)

    if (relatedError) {
      console.error('Error fetching related products:', relatedError)
    }

    // Get unique storage options from variants
    const storageOptions = product.variants 
      ? [...new Set(product.variants.map(v => v.storage))].filter(Boolean).sort()
      : []

    // Get unique color options from variants
    const colorOptions = product.variants
      ? [...new Map(product.variants.map(v => [v.color, v])).values()]
          .filter(v => v.color)
          .map(v => ({
            color: v.color,
            color_hex: v.color_hex
          }))
      : []

    // Group specifications by category
    const groupedSpecs = {}
    if (product.specifications) {
      product.specifications.forEach(spec => {
        if (!groupedSpecs[spec.spec_group]) {
          groupedSpecs[spec.spec_group] = []
        }
        groupedSpecs[spec.spec_group].push({
          name: spec.spec_name,
          value: spec.spec_value,
          icon: spec.icon
        })
      })
    }

    // Group prices by store
    const storeCount = prices ? new Set(prices.map(p => p.store_id)).size : 0

    const normalizedPrices = (prices || []).map((p) => ({
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

    // Build response
    const response = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      launchYear: product.launch_year,
      badge: product.badge,
      brand: {
        id: product.brand_id,
        name: product.brand_name,
        slug: product.brand_slug,
        logo: product.brand_logo
      },
      mainImage: product.main_image,
      images: product.images || [],
      bestPrice: {
        amount: product.best_price,
        store: product.best_store_name,
        storeLogo: product.best_store_logo,
        lastUpdated: product.price_last_updated
      },
      expertRating: {
        overallScore: product.overall_score,
        scores: {
          camera: {
            score: product.camera_score,
            details: product.camera_details?.details || []
          },
          battery: {
            score: product.battery_score,
            details: product.battery_details?.details || []
          },
          performance: {
            score: product.performance_score,
            details: product.performance_details?.details || []
          },
          display: {
            score: product.display_score,
            details: product.display_details?.details || []
          }
        },
        pros: product.pros || [],
        cons: product.cons || []
      },
      variants: {
        storage: storageOptions,
        colors: colorOptions,
        all: (product.variants || []).map(v => ({
          id: v.id,
          storage: v.storage,
          color: v.color,
          color_hex: v.color_hex,
          variant_image: v.variant_image
        }))
      },
      keySpecifications: product.key_specifications || [],
      specifications: groupedSpecs,
      prices: {
        count: storeCount,
        items: normalizedPrices,
        lastUpdated: product.price_last_updated
      },
      similarProducts: relatedProducts?.map(rp => ({
        id: rp.related_product.id,
        name: rp.related_product.name,
        slug: rp.related_product.slug,
        image: rp.related_product.main_image,
        price: rp.related_product.best_price,
        brand: rp.related_product.brand?.name
      })) || []
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in product API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
