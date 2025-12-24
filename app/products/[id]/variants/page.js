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

export default function ProductVariantsPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [productId, setProductId] = useState(null)
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [formData, setFormData] = useState({
    storage: '',
    color: '',
    color_hex: '',
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
      const [productRes, variantsRes] = await Promise.all([
        supabase.from('products').select('*, brands(name)').eq('id', productId).single(),
        supabase.from('product_variants').select('*').eq('product_id', productId)
      ])

      if (productRes.error) throw productRes.error
      if (variantsRes.error) throw variantsRes.error

      setProduct(productRes.data)
      setVariants(variantsRes.data || [])
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
        color_hex: '',
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color_hex">Color Hex Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="color_hex"
                    value={formData.color_hex}
                    onChange={(e) => setFormData(prev => ({ ...prev, color_hex: e.target.value }))}
                    placeholder="e.g., #E8E3D9"
                  />
                  {formData.color_hex && (
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: formData.color_hex }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variant_image">Variant Image URL</Label>
              <Input
                id="variant_image"
                value={formData.variant_image}
                onChange={(e) => setFormData(prev => ({ ...prev, variant_image: e.target.value }))}
                placeholder="Optional"
              />
              {formData.variant_image && (
                <img src={formData.variant_image} alt="Preview" className="mt-2 h-32 w-auto object-contain border rounded" />
              )}
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
                <TableHead>Storage</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Color Preview</TableHead>
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
                    <TableCell className="font-medium">{variant.storage}</TableCell>
                    <TableCell>{variant.color}</TableCell>
                    <TableCell>
                      {variant.color_hex && (
                        <div 
                          className="w-8 h-8 rounded border" 
                          style={{ backgroundColor: variant.color_hex }}
                          title={variant.color_hex}
                        />
                      )}
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
