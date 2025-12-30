import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req) {
  try {
    const body = await req.json()
    const { productData, brandId } = body

    if (!productData || !brandId) {
      return NextResponse.json(
        { error: 'Missing productData or brandId' },
        { status: 400 }
      )
    }

    // Start a transaction-like operation
    // 1. Create or update product
    const slug = productData.slug || productData.name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')

    // Check if product exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()

    let productId
    if (existingProduct) {
      productId = existingProduct.id
      // Update existing product
      await supabase
        .from('products')
        .update({
          brand_id: brandId,
          name: productData.name,
          description: productData.description || null,
          launch_year: productData.launch_year || new Date().getFullYear(),
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
    } else {
      // Insert new product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([{
          brand_id: brandId,
          name: productData.name,
          slug: slug,
          description: productData.description || null,
          launch_year: productData.launch_year || new Date().getFullYear(),
          is_active: true
        }])
        .select()

      if (productError) throw productError
      productId = newProduct[0].id
    }

    // 2. Insert key specifications
    if (productData.keySpecifications && productData.keySpecifications.length > 0) {
      // Delete existing key specs
      await supabase
        .from('key_specifications')
        .delete()
        .eq('product_id', productId)

      // Map icons based on spec title
      const iconMap = {
        'Display': '📱',
        'Camera': '📷',
        'Processor': '⚡',
        'Battery': '🔋',
        'RAM': '💾',
        'Storage': '📦'
      }

      const keySpecsToInsert = productData.keySpecifications.map((spec, idx) => ({
        product_id: productId,
        icon: spec.icon || iconMap[spec.title] || '✨',
        title: spec.title,
        value: spec.value,
        sort_order: idx
      }))

      const { error: keySpecError } = await supabase
        .from('key_specifications')
        .insert(keySpecsToInsert)

      if (keySpecError) throw keySpecError
    }

    // 3. Insert full specifications
    if (productData.specifications && productData.specifications.length > 0) {
      // Delete existing specs
      await supabase
        .from('specifications')
        .delete()
        .eq('product_id', productId)

      const specsToInsert = productData.specifications.map((spec, idx) => ({
        product_id: productId,
        spec_group: spec.spec_group,
        spec_name: spec.spec_name,
        spec_value: spec.spec_value,
        icon: spec.icon || null,
        sort_order: idx
      }))

      const { error: specsError } = await supabase
        .from('specifications')
        .insert(specsToInsert)

      if (specsError) throw specsError
    }

    // 4. Insert variants (storage options) - optional
    if (productData.variants && productData.variants.length > 0) {
      // Delete existing variants
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId)

      const variantsToInsert = productData.variants.map((storage) => ({
        product_id: productId,
        storage: storage,
        is_available: true
      }))

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert)

      if (variantsError) throw variantsError
    } else {
      // If no variants provided, create a default one
      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert([{
          product_id: productId,
          storage: 'Default',
          is_available: true
        }])
      
      if (variantsError) throw variantsError
    }

    // 5. Insert colors if provided
    if (productData.colors && productData.colors.length > 0) {
      // We'll create color variants by combining storage with colors
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, storage')
        .eq('product_id', productId)

      if (!variantsError && variants && variants.length > 0) {
        const colorVariantsToInsert = []
        
        productData.colors.forEach(color => {
          variants.forEach(variant => {
            // Only add if we have at least some color info
            if (color && color.trim()) {
              colorVariantsToInsert.push({
                product_id: productId,
                storage: variant.storage,
                color: color,
                color_hex: null, // User can edit this later
                is_available: true
              })
            }
          })
        })

        if (colorVariantsToInsert.length > 0) {
          // Delete variants without colors first
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', productId)

          // Insert new variants with colors
          const { error: colorError } = await supabase
            .from('product_variants')
            .insert(colorVariantsToInsert)

          if (colorError) throw colorError
        }
      }
    }

    return NextResponse.json({
      success: true,
      productId,
      message: `Product "${productData.name}" saved successfully!`
    })
  } catch (error) {
    console.error('Bulk save error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save product' },
      { status: 500 }
    )
  }
}
