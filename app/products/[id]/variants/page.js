'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { Trash2, Plus } from "lucide-react"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import Image from "next/image"

export default function ProductVariantsPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [productId, setProductId] = useState(null)
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [colors, setColors] = useState([])
  const [productImages, setProductImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteColorId, setDeleteColorId] = useState(null)
  const [formData, setFormData] = useState({
    storage: ''
  })
  const [colorFormData, setColorFormData] = useState({
    color_name: '',
    color_hex: '#000000',
    color_image: ''
  })

  useEffect(() => {
    const unwrapParams = async () => {
      const unwrapped = await params
      setProductId(unwrapped.id)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (productId) {
      fetchData()
    }
  }, [productId])

  const fetchData = async () => {
    try {
      const [productRes, variantsRes, colorsRes, imagesRes] = await Promise.all([
        supabase.from('products').select('*, brands(name)').eq('id', productId).single(),
        supabase.from('product_variants').select('*').eq('product_id', productId).order('storage'),
        supabase.from('product_colors').select('*').eq('product_id', productId).order('sort_order'),
        supabase.from('product_images').select('*').eq('product_id', productId).order('sort_order')
      ])

      if (productRes.error) throw productRes.error
      if (variantsRes.error) throw variantsRes.error

      setProduct(productRes.data)
      setVariants(variantsRes.data || [])
      setColors(colorsRes.data || [])
      
      const galleryImages = (imagesRes.data || []).map(img => ({
        id: img.id,
        image_url: img.image_url,
        source: img.image_url.split('/').pop(),
        created_at: img.created_at
      }))

      galleryImages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setProductImages(galleryImages)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load product data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.storage.trim()) {
      toast({
        title: "Error",
        description: "Storage is required",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('product_variants')
        .insert([{
          product_id: productId,
          storage: formData.storage.trim()
        }])

      if (error) throw error

      toast({
        title: "Success",
        description: `Variant "${formData.storage}" added successfully`
      })

      setFormData({ 
        storage: ''
      })
      fetchData()
    } catch (error) {
      console.error('Error adding variant:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to add variant",
        variant: "destructive"
      })
    }
  }

  const handleAddColor = async (e) => {
    e.preventDefault()

    if (!colorFormData.color_name.trim()) {
      toast({
        title: "Error",
        description: "Color name is required",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('product_colors')
        .insert([{
          product_id: productId,
          color_name: colorFormData.color_name.trim(),
          color_hex: colorFormData.color_hex,
          color_image: colorFormData.color_image,
          sort_order: colors.length
        }])

      if (error) throw error

      toast({
        title: "Success",
        description: `Color "${colorFormData.color_name}" added successfully`
      })

      setColorFormData({
        color_name: '',
        color_hex: '#000000',
        color_image: ''
      })
      fetchData()
    } catch (error) {
      console.error('Error adding color:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to add color",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', deleteId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Variant deleted successfully"
      })
      setDeleteId(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting variant:', error)
      toast({
        title: "Error",
        description: "Failed to delete variant",
        variant: "destructive"
      })
    }
  }

  const handleDeleteColor = async () => {
    try {
      const { error } = await supabase
        .from('product_colors')
        .delete()
        .eq('id', deleteColorId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Color deleted successfully"
      })
      setDeleteColorId(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting color:', error)
      toast({
        title: "Error",
        description: "Failed to delete color",
        variant: "destructive"
      })
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Variants</h1>
        <p className="text-muted-foreground mt-2">
          {product?.brands?.name} - {product?.name}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          📦 Storage variants determine pricing. 🎨 Colors are options available across all variants.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Storage Variants Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📦 Storage Variants</CardTitle>
              <p className="text-sm text-muted-foreground">Price changes by storage</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storage">Storage Size *</Label>
                  <Input
                    id="storage"
                    value={formData.storage}
                    onChange={(e) => setFormData(prev => ({ ...prev, storage: e.target.value }))}
                    placeholder="e.g., 256GB, 512GB, 1TB"
                  />
                  <p className="text-xs text-muted-foreground">
                    Each storage size creates a variant with its own pricing
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Storage Variant
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Variants ({variants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No storage variants added yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Storage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((variant) => (
                      <TableRow key={variant.id}>
                        <TableCell>
                          <span className="font-semibold">{variant.storage}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(variant.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colors Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🎨 Available Colors</CardTitle>
              <p className="text-sm text-muted-foreground">Colors available for all variants</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddColor} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="color_name">Color Name *</Label>
                  <Input
                    id="color_name"
                    value={colorFormData.color_name}
                    onChange={(e) => setColorFormData(prev => ({ ...prev, color_name: e.target.value }))}
                    placeholder="e.g., Deep Blue, Silver, Cosmic Orange"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color_hex">Color Code (Optional)</Label>
                  <div className="flex gap-2">
                    <input
                      id="color_hex"
                      type="color"
                      value={colorFormData.color_hex}
                      onChange={(e) => setColorFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                      className="h-10 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colorFormData.color_hex}
                      onChange={(e) => setColorFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Color Image *</Label>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                    <span>Select an image for this color</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/products/${productId}/images`)}
                    >
                      Go to Images
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                    {productImages.length === 0 ? (
                      <p className="col-span-3 text-center text-muted-foreground text-xs">
                        No images. Upload in Product Images first.
                      </p>
                    ) : (
                      productImages.map((img) => (
                        <div
                          key={img.id}
                          className={`relative border-2 rounded-md overflow-hidden cursor-pointer transition-all ${
                            colorFormData.color_image === img.image_url 
                              ? 'border-primary ring-2 ring-primary/20' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          title={img.source}
                          onClick={() => setColorFormData(prev => ({ ...prev, color_image: img.image_url }))}
                        >
                          {img.image_url.includes('supabase.co') ? (
                            <div className="relative w-full h-20">
                              <Image
                                src={img.image_url}
                                alt={img.source}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <img
                              src={img.image_url}
                              alt={img.source}
                              className="w-full h-20 object-cover"
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Color
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Colors ({colors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {colors.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No colors added yet</p>
              ) : (
                <div className="space-y-2">
                  {colors.map((color) => (
                    <div key={color.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        {color.color_image ? (
                          <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden border">
                            {color.color_image.includes('supabase.co') ? (
                              <Image
                                src={color.color_image}
                                alt={color.color_name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <img
                                src={color.color_image}
                                alt={color.color_name}
                                className="w-12 h-12 object-cover"
                              />
                            )}
                          </div>
                        ) : (
                          <div 
                            className="w-12 h-12 rounded border border-gray-300" 
                            style={{ backgroundColor: color.color_hex || '#999999' }}
                            title={color.color_hex}
                          />
                        )}
                        <div className="flex-1">
                          <span className="font-medium">{color.color_name}</span>
                          {color.color_hex && (
                            <code className="text-xs text-muted-foreground block">{color.color_hex}</code>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteColorId(color.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="font-semibold text-blue-900 dark:text-blue-100">💡 How it works</p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>✅ Create storage variants (256GB, 512GB, 1TB)</li>
                  <li>✅ Create colors available for your product</li>
                  <li>✅ Set prices per storage variant in Prices section</li>
                  <li>✅ Colors are options, prices depend only on storage</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Button variant="outline" onClick={() => router.push('/products')}>
        Back to Products
      </Button>

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Variant"
        description="Are you sure you want to delete this storage variant? Prices linked to this variant will also be deleted."
      />

      <DeleteDialog
        open={!!deleteColorId}
        onOpenChange={(open) => !open && setDeleteColorId(null)}
        onConfirm={handleDeleteColor}
        title="Delete Color"
        description="Are you sure you want to delete this color option?"
      />
    </div>
  )
}
