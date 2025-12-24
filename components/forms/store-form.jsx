'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/shared/image-upload"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export function StoreForm({ storeId }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(!!storeId)
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    website_url: '',
    is_official: false,
    is_active: true
  })

  useEffect(() => {
    if (storeId) {
      fetchStore()
    }
  }, [storeId])

  const fetchStore = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single()

      if (error) throw error
      setFormData(data)
    } catch (error) {
      console.error('Error fetching store:', error)
      toast({
        title: "Error",
        description: "Failed to fetch store data",
        variant: "destructive"
      })
    } finally {
      setFetchingData(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (storeId) {
        const { error } = await supabase
          .from('stores')
          .update(formData)
          .eq('id', storeId)

        if (error) throw error

        toast({
          title: "Success",
          description: "Store updated successfully"
        })
      } else {
        const { error } = await supabase
          .from('stores')
          .insert([formData])

        if (error) throw error

        toast({
          title: "Success",
          description: "Store created successfully"
        })
      }

      router.push('/stores')
      router.refresh()
    } catch (error) {
      console.error('Error saving store:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save store",
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
          <CardTitle>{storeId ? 'Edit Store' : 'Create Store'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Store Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Amazon, Noon"
            />
          </div>

          <div className="space-y-2">
            <Label>Store Logo</Label>
            <ImageUpload
              bucket="stores"
              value={formData.logo}
              onChange={(url) => setFormData(prev => ({ ...prev, logo: url }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              value={formData.website_url}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_official"
              checked={formData.is_official}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_official: checked }))
              }
            />
            <Label htmlFor="is_official">Official Store</Label>
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
              {loading ? 'Saving...' : storeId ? 'Update Store' : 'Create Store'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/stores')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
