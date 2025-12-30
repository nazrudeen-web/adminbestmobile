'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { slugify } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export function ProductForm({ productId }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(!!productId)
  const [brands, setBrands] = useState([])
  const [formData, setFormData] = useState({
    brand_id: '',
    name: '',
    slug: '',
    description: '',
    launch_year: new Date().getFullYear(),
    badge: '',
    is_active: true
  })

  useEffect(() => {
    fetchBrands()
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setBrands(data || [])
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error
      
      // Ensure all string fields have values (not null/undefined)
      setFormData({
        brand_id: data.brand_id || '',
        name: data.name || '',
        slug: data.slug || '',
        description: data.description || '',
        launch_year: data.launch_year || new Date().getFullYear(),
        badge: data.badge || '',
        is_active: data.is_active ?? true
      })
    } catch (error) {
      console.error('Error fetching product:', error)
      toast({
        title: "Error",
        description: "Failed to fetch product data",
        variant: "destructive"
      })
    } finally {
      setFetchingData(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && !productId ? { slug: slugify(value) } : {})
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (productId) {
        const { error } = await supabase
          .from('products')
          .update({
            brand_id: formData.brand_id,
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            launch_year: parseInt(formData.launch_year),
            badge: formData.badge,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId)

        if (error) throw error

        toast({
          title: "Success",
          description: "Product updated successfully"
        })
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            ...formData,
            launch_year: parseInt(formData.launch_year)
          }])

        if (error) throw error

        toast({
          title: "Success",
          description: "Product created successfully"
        })
      }

      router.push('/products')
      router.refresh()
    } catch (error) {
      console.error('Error saving product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetchingData) {
    return <LoadingSpinner />
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{productId ? 'Edit Product' : 'Create Product'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="brand_id">Brand *</Label>
            <Select
              id="brand_id"
              name="brand_id"
              value={formData.brand_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., iPhone 16 Pro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              placeholder="auto-generated from name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Short product description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="launch_year">Launch Year</Label>
            <Input
              id="launch_year"
              name="launch_year"
              type="number"
              value={formData.launch_year}
              onChange={handleChange}
              min="2000"
              max="2099"
            />
          </div>

          {productId && (
            <div className="space-y-2">
              <Label>Product Images</Label>
              <div className="border rounded-md p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Manage product images on the dedicated images page
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/products/${productId}/images`)}
                >
                  Go to Images
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="badge">Badge</Label>
            <Input
              id="badge"
              name="badge"
              value={formData.badge}
              onChange={handleChange}
              placeholder="e.g., Best Choice, Editor's Pick"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_active: checked }))
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/products')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
