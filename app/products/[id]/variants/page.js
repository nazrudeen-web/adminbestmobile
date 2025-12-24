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
import { Trash2 } from "lucide-react"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import Image from "next/image"

export default function ProductVariantsPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [productId, setProductId] = useState(null)
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [productImages, setProductImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [formData, setFormData] = useState({
    storage: '',
    color: '',
    variant_image: ''
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
      const [productRes, variantsRes, imagesRes] = await Promise.all([
        supabase.from('products').select('*, brands(name)').eq('id', productId).single(),
        supabase.from('product_variants').select('*').eq('product_id', productId),
        supabase.from('product_images').select('*').eq('product_id', productId).order('sort_order')
      ])

      if (productRes.error) throw productRes.error
      if (variantsRes.error) throw variantsRes.error

      setProduct(productRes.data)
      setVariants(variantsRes.data || [])
      
      // Use only product_images table for variant selection
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

    try {
      const { error } = await supabase
        .from('product_variants')
        .insert([{
          product_id: productId,
          ...formData
        }])

      if (error) throw error

      toast({
        title: "Success",
        description: "Variant added successfully"
      })

      setFormData({ 
        storage: '', 
        color: '',
        variant_image: ''
      })
      fetchData()
    } catch (error) {
      console.error('Error adding variant:', error)
      toast({
        title: "Error",
        description: "Failed to add variant",
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

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Variants</h1>
        <p className="text-muted-foreground mt-2">
          {product?.brands?.name} - {product?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Variant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storage">Storage *</Label>
                <Input
                  id="storage"
                  value={formData.storage}
                  onChange={(e) => setFormData(prev => ({ ...prev, storage: e.target.value }))}
                  required
                  placeholder="e.g., 256GB, 512GB, 1TB"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  required
                  placeholder="e.g., Natural Titanium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Variant Image</Label>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Select an image uploaded in Product Images.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/products/${productId}/images`)}
                >
                  Go to Images
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2 border rounded-md p-4 max-h-64 overflow-y-auto">
                {productImages.length === 0 ? (
                  <p className="col-span-4 text-center text-muted-foreground text-sm">
                    No images available. Upload images in the Product Images page first.
                  </p>
                ) : (
                  productImages.map((img) => (
                    <div
                      key={img.id}
                      className={`relative border-2 rounded-md overflow-hidden cursor-pointer ${
                        formData.variant_image === img.image_url ? 'border-primary' : 'border-transparent'
                      }`}
                      title={img.source}
                      onClick={() => setFormData(prev => ({ ...prev, variant_image: img.image_url }))}
                    >
                      {img.image_url.includes('supabase.co') ? (
                        <div className="relative w-full h-24">
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
                          className="w-full h-24 object-cover"
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 truncate">
                        {img.source}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button type="submit">Add Variant</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Variants ({variants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No variants added yet
                  </TableCell>
                </TableRow>
              ) : (
                variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell>
                      {variant.variant_image ? (
                        variant.variant_image.includes('supabase.co') ? (
                          <div className="relative w-16 h-16">
                            <Image
                              src={variant.variant_image}
                              alt={variant.color}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        ) : (
                          <img
                            src={variant.variant_image}
                            alt={variant.color}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs">
                          No image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{variant.storage}</TableCell>
                    <TableCell>{variant.color}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => router.push('/products')}>
        Back to Products
      </Button>

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Variant"
        description="Are you sure you want to delete this variant? This will also delete associated prices."
      />
    </div>
  )
}
