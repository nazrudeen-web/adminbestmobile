'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { slugify } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/shared/image-upload"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export function BrandForm({ brandId }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(!!brandId)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    is_active: true
  })

  useEffect(() => {
    if (brandId) {
      fetchBrand()
    }
  }, [brandId])

  const fetchBrand = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

      if (error) throw error
      setFormData(data)
    } catch (error) {
      console.error('Error fetching brand:', error)
      toast({
        title: "Error",
        description: "Failed to fetch brand data",
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
      ...(name === 'name' && !brandId ? { slug: slugify(value) } : {})
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (brandId) {
        const { error } = await supabase
          .from('brands')
          .update({
            name: formData.name,
            slug: formData.slug,
            logo: formData.logo,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', brandId)

        if (error) throw error

        toast({
          title: "Success",
          description: "Brand updated successfully"
        })
      } else {
        const { error } = await supabase
          .from('brands')
          .insert([formData])

        if (error) throw error

        toast({
          title: "Success",
          description: "Brand created successfully"
        })
      }

      router.push('/brands')
      router.refresh()
    } catch (error) {
      console.error('Error saving brand:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save brand",
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
          <CardTitle>{brandId ? 'Edit Brand' : 'Create Brand'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Apple, Samsung"
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
            <Label>Brand Logo</Label>
            <ImageUpload
              bucket="brands"
              value={formData.logo}
              onChange={(url) => setFormData(prev => ({ ...prev, logo: url }))}
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
              {loading ? 'Saving...' : brandId ? 'Update Brand' : 'Create Brand'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/brands')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
