'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { useToast } from "@/components/ui/toast"
import { ArrowLeft, Edit, Eye, EyeOff, ExternalLink } from "lucide-react"
import Image from "next/image"

export default function ProductPreviewPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [productId, setProductId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [productData, setProductData] = useState(null)

  useEffect(() => {
    const unwrapParams = async () => {
      const unwrapped = await params
      setProductId(unwrapped.id)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (productId) {
      fetchProductData()
    }
  }, [productId])

  const fetchProductData = async () => {
    try {
      // Fetch product with all related data
      const [productRes, imagesRes, variantsRes, keySpecsRes, specsRes, ratingsRes] = await Promise.all([
        supabase.from('products').select('*, brands(name, logo)').eq('id', productId).single(),
        supabase.from('product_images').select('*').eq('product_id', productId).order('sort_order'),
        supabase.from('product_variants').select('*').eq('product_id', productId).order('storage'),
        supabase.from('key_specifications').select('*').eq('product_id', productId).order('sort_order'),
        supabase.from('specifications').select('*').eq('product_id', productId).order('spec_group, sort_order'),
        supabase.from('expert_ratings').select('*').eq('product_id', productId).single()
      ])

      if (productRes.error) throw productRes.error

      // Fetch prices - query by product_id directly since we confirmed variant_id is populated
      let pricesData = []
      if (productRes.data?.id) {
        try {
          const { data: allPrices, error } = await supabase
            .from('prices')
            .select('id, product_id, variant_id, store_id, price, affiliate_url, updated_at')
            .eq('product_id', productRes.data.id)
          
          console.log('Prices for product:', productRes.data.id, '- Count:', allPrices?.length || 0, 'Error:', error)
          
          if (allPrices && allPrices.length > 0) {
            // Now fetch the full details with relationships
            const pricesRes = await supabase
              .from('prices')
              .select('*, stores(id, name, logo, is_official), product_variants(id, storage)')
              .eq('product_id', productRes.data.id)
              .order('price')
            
            pricesData = pricesRes.data || []
            console.log('Prices with relationships:', pricesData.length)
          }
        } catch (error) {
          console.error('Error fetching prices:', error)
        }
      }

      setProductData({
        product: productRes.data,
        images: imagesRes.data || [],
        variants: variantsRes.data || [],
        keySpecs: keySpecsRes.data || [],
        specs: specsRes.data || [],
        ratings: ratingsRes.data,
        prices: pricesData
      })
    } catch (error) {
      console.error('Error fetching product data:', error)
      toast({
        title: "Error",
        description: "Failed to load product data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePublish = async () => {
    setPublishing(true)
    try {
      const newStatus = !productData.product.is_active
      const { error } = await supabase
        .from('products')
        .update({ is_active: newStatus })
        .eq('id', productId)

      if (error) throw error

      setProductData(prev => ({
        ...prev,
        product: { ...prev.product, is_active: newStatus }
      }))

      toast({
        title: "Success",
        description: newStatus ? "Product published successfully" : "Product unpublished"
      })
    } catch (error) {
      console.error('Error toggling publish status:', error)
      toast({
        title: "Error",
        description: "Failed to update publish status",
        variant: "destructive"
      })
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!productData) return <div>Product not found</div>

  const { product, images, variants, keySpecs, ratings, prices, specs } = productData
  const mainImage = images.find(img => img.is_main) || images[0]

  // Group specs by category
  const groupedSpecs = specs.reduce((acc, spec) => {
    if (!acc[spec.spec_group]) {
      acc[spec.spec_group] = []
    }
    acc[spec.spec_group].push(spec)
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/products')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Preview Product</h1>
            <p className="text-muted-foreground mt-1">
              Review all details before publishing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={product.is_active ? "default" : "secondary"} className="text-sm px-3 py-1">
            {product.is_active ? "Published" : "Draft"}
          </Badge>
          <Button
            variant={product.is_active ? "outline" : "default"}
            onClick={togglePublish}
            disabled={publishing}
          >
            {product.is_active ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Completeness Check */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Completeness Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <CheckItem label="Product Information" completed={product.name && product.description} />
            <CheckItem label="Main Image" completed={!!product.main_image} />
            <CheckItem label="Product Images" completed={images.length > 0} count={images.length} />
            <CheckItem label="Variants" completed={variants.length > 0} count={variants.length} />
            <CheckItem label="Key Specifications" completed={keySpecs.length >= 4} count={keySpecs.length} recommended={4} />
            <CheckItem label="Full Specifications" completed={specs.length > 0} count={specs.length} />
            <CheckItem label="Expert Ratings" completed={!!ratings} />
            <CheckItem label="Prices" completed={prices.length > 0} count={prices.length} />
          </div>
        </CardContent>
      </Card>

      {/* Product Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product Overview</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/products/${productId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              {mainImage ? (
                <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={mainImage.image_url}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">No image</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{product.brands?.name}</p>
                <h2 className="text-3xl font-bold">{product.name}</h2>
                {product.badge && (
                  <Badge className="mt-2">{product.badge}</Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best Price</p>
                <p className="text-2xl font-bold">
                  {product.best_price ? `AED ${product.best_price.toLocaleString()}` : 'Price not set'}
                </p>
              </div>
              {ratings && (
                <div>
                  <p className="text-sm text-muted-foreground">Expert Score</p>
                  <p className="text-4xl font-bold text-primary">{ratings.overall_score}/10</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Launch Year</p>
                <p className="font-medium">{product.launch_year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{product.description || 'No description'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product Images ({images.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/products/${productId}/images`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={image.id} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={image.image_url}
                    alt={`${product.name} - Image ${index + 1}`}
                    fill
                    className="object-contain p-2"
                  />
                  {image.is_main && (
                    <Badge className="absolute top-2 left-2 text-xs">Main</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No images added</p>
          )}
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Variants ({variants.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/products/${productId}/variants`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {variants.length > 0 ? (
            <div className="space-y-2">
              {variants.map((variant) => (
                <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border-2"
                      style={{ backgroundColor: variant.color_hex }}
                    />
                    <div>
                      <p className="font-medium">{variant.storage} - {variant.color}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No variants added</p>
          )}
        </CardContent>
      </Card>

      {/* Key Specifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Key Specifications ({keySpecs.length}/4)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/products/${productId}/key-specs`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {keySpecs.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {keySpecs.map((spec) => (
                <div key={spec.id} className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{spec.title}</p>
                  <p className="font-semibold">{spec.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No key specifications added</p>
          )}
        </CardContent>
      </Card>

      {/* Expert Ratings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expert Ratings</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/products/${productId}/ratings`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ratings ? (
            <div className="space-y-4">
              <div className="text-center p-6 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Overall Expert Score</p>
                <p className="text-5xl font-bold text-primary">{ratings.overall_score}/10</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: '📷 Camera', score: ratings.camera_score, title: ratings.camera_details?.details?.[0], pros: ratings.camera_pros, cons: ratings.camera_cons },
                  { label: '🔋 Battery', score: ratings.battery_score, title: ratings.battery_details?.details?.[0], pros: ratings.battery_pros, cons: ratings.battery_cons },
                  { label: '⚡ Performance', score: ratings.performance_score, title: ratings.performance_details?.details?.[0], pros: ratings.performance_pros, cons: ratings.performance_cons },
                  { label: '📱 Display', score: ratings.display_score, title: ratings.display_details?.details?.[0], pros: ratings.display_pros, cons: ratings.display_cons }
                ].map((category) => (
                  <div key={category.label} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{category.label}</p>
                      <p className="text-2xl font-bold">{category.score}/10</p>
                    </div>
                    {category.title && (
                      <p className="text-sm text-muted-foreground mb-2">{category.title}</p>
                    )}
                    {category.pros && category.pros.length > 0 && (
                      <div className="mt-2">
                        {category.pros.map((pro, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-green-600">
                            <span>✓</span>
                            <span>{pro}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {category.cons && category.cons.length > 0 && (
                      <div className="mt-2">
                        {category.cons.map((con, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-red-600">
                            <span>✗</span>
                            <span>{con}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No ratings added</p>
          )}
        </CardContent>
      </Card>

      {/* Full Specifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Full Specifications ({specs.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/products/${productId}/specs`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {specs.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedSpecs).map(([group, groupSpecs]) => (
                <div key={group} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">{group}</h3>
                  <div className="space-y-2">
                    {groupSpecs.map((spec) => (
                      <div key={spec.id} className="flex justify-between py-2 border-b last:border-0">
                        <span className="text-muted-foreground">{spec.spec_name}</span>
                        <span className="font-medium">{spec.spec_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No specifications added</p>
          )}
        </CardContent>
      </Card>

      {/* Prices */}
      <Card>
        <CardHeader>
          <CardTitle>Compare Prices ({prices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {prices.length > 0 ? (
            <div className="space-y-2">
              {prices.map((price) => (
                <div key={price.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {price.stores?.logo && (
                      <Image
                        src={price.stores.logo}
                        alt={price.stores.name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{price.stores?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {price.product_variants?.storage} - {price.product_variants?.color}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">AED {price.price.toLocaleString()}</p>
                    {price.old_price && (
                      <p className="text-sm text-muted-foreground line-through">
                        AED {price.old_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No prices added</p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
        <Button
          variant="outline"
          onClick={() => router.push('/products')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/products/${productId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
          <Button
            variant={product.is_active ? "outline" : "default"}
            onClick={togglePublish}
            disabled={publishing}
          >
            {product.is_active ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Publish Now
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CheckItem({ label, completed, count, recommended }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        <span className={`text-xl ${completed ? 'text-green-500' : 'text-muted-foreground'}`}>
          {completed ? '✓' : '○'}
        </span>
        <span className={completed ? 'font-medium' : 'text-muted-foreground'}>
          {label}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">
        {count !== undefined && (
          <span>
            {count}{recommended ? `/${recommended}` : ''}
          </span>
        )}
      </div>
    </div>
  )
}
