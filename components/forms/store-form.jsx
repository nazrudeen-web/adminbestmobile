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
import Image from "next/image"

export function StoreForm({ storeId }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(!!storeId)
  const [brands, setBrands] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    is_official: false,
    is_authorized_seller: false,
    is_active: true
  })

  useEffect(() => {
    fetchBrands()
    if (storeId) {
      fetchStore()
    }
  }, [storeId])

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, logo')
        .not('logo', 'is', null)
        .order('name')

      if (error) throw error
      setBrands(data || [])
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

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

          <div className="space-y-4">
            <Label>Store Logo</Label>
            
            {/* Show current logo if exists */}
            {formData.logo && (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={formData.logo}
                    alt="Store logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Current Logo</p>
                  <p className="text-xs text-muted-foreground truncate">{formData.logo}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                >
                  Remove
                </Button>
              </div>
            )}

            {/* Select from existing brand logos */}
            {brands.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-sm text-muted-foreground">Or select from brand logos</span>
                  <div className="h-px bg-border flex-1" />
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo: brand.logo }))}
                      className={`relative aspect-square border-2 rounded-lg p-2 hover:border-primary transition-colors ${
                        formData.logo === brand.logo ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      title={brand.name}
                    >
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        fill
                        className="object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Click on a brand logo to use it for this store
                </p>
              </div>
            )}

            {/* Upload custom logo */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-sm text-muted-foreground">Or upload custom logo</span>
                <div className="h-px bg-border flex-1" />
              </div>
              <ImageUpload
                bucket="stores"
                value={formData.logo}
                onChange={(url) => setFormData(prev => ({ ...prev, logo: url }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label className="text-base">Official Store</Label>
              <p className="text-sm text-muted-foreground">
                Mark if this is an official brand store (shows "Official Store" badge)
              </p>
            </div>
            <Switch
              id="is_official"
              checked={formData.is_official}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_official: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label className="text-base">Authorized Seller</Label>
              <p className="text-sm text-muted-foreground">
                Mark if this is an authorized seller (shows "Authorized Seller" badge)
              </p>
            </div>
            <Switch
              id="is_authorized_seller"
              checked={formData.is_authorized_seller}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_authorized_seller: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label className="text-base">Active</Label>
              <p className="text-sm text-muted-foreground">
                Inactive stores won't appear in price comparisons
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_active: checked }))
              }
            />
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
