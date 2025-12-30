'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export function PriceForm({ priceId }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(!!priceId)
  const [products, setProducts] = useState([])
  const [variants, setVariants] = useState([])
  const [stores, setStores] = useState([])
  const [formData, setFormData] = useState({
    product_id: '',
    variant_id: '',
    store_id: '',
    price: '',
    affiliate_url: ''
  })

  useEffect(() => {
    fetchProducts()
    fetchStores()
    if (priceId) {
      fetchPrice()
    }
  }, [priceId])

  useEffect(() => {
    if (formData.product_id) {
      fetchVariants(formData.product_id)
    }
  }, [formData.product_id])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brands(name)')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchVariants = async (productId) => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)

      if (error) throw error
      setVariants(data || [])
      
      // Reset variant_id if it doesn't belong to the selected product
      if (formData.variant_id) {
        const variantExists = data?.some(v => v.id === formData.variant_id)
        if (!variantExists) {
          setFormData(prev => ({ ...prev, variant_id: '' }))
        }
      }
    } catch (error) {
      console.error('Error fetching variants:', error)
      setVariants([])
    }
  }

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setStores(data || [])
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  const fetchPrice = async () => {
    try {
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('id', priceId)
        .single()

      if (error) throw error
      setFormData({
        product_id: data.product_id || '',
        variant_id: data.variant_id || '',
        store_id: data.store_id || '',
        price: data.price?.toString() || '',
        affiliate_url: data.affiliate_url || ''
      })
    } catch (error) {
      console.error('Error fetching price:', error)
      toast({
        title: "Error",
        description: "Failed to fetch price data",
        variant: "destructive"
      })
    } finally {
      setFetchingData(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'price') {
      // Normalize pasted values like "3,919.00" to "3919.00"
      // Remove thousands separators and whitespace; keep at most one dot
      const cleaned = value
        .replace(/,/g, '')
        .replace(/\s+/g, '')
      setFormData(prev => ({ ...prev, [name]: cleaned }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.product_id || !formData.variant_id || !formData.store_id || !formData.price) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // Send price as a string to avoid floating point drift
      const normalizedPrice = (formData.price || '').replace(/,/g, '').trim()
      const priceData = {
        product_id: formData.product_id,
        variant_id: formData.variant_id,
        store_id: formData.store_id,
        price: normalizedPrice,
        affiliate_url: formData.affiliate_url,
        updated_at: new Date().toISOString()
      }

      console.log('Saving price with data:', priceData)

      if (priceId) {
        const { error } = await supabase
          .from('prices')
          .update(priceData)
          .eq('id', priceId)

        if (error) throw error

        toast({
          title: "Success",
          description: "Price updated successfully"
        })
      } else {
        // Use upsert to respect unique (variant_id, store_id)
        const { error } = await supabase
          .from('prices')
          .upsert([priceData], { onConflict: 'variant_id,store_id' })

        if (error) throw error

        toast({
          title: "Success",
          description: "Price saved successfully"
        })
      }

      router.push('/prices')
      router.refresh()
    } catch (error) {
      console.error('Error saving price:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save price",
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
          <CardTitle>{priceId ? 'Edit Price' : 'Add New Price'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="product_id">Product *</Label>
            <Select
              id="product_id"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.brands?.name} - {product.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant_id">Storage Variant *</Label>
            <Select
              id="variant_id"
              name="variant_id"
              value={formData.variant_id}
              onChange={handleChange}
              required
              disabled={!formData.product_id}
            >
              <option value="">Select storage variant</option>
              {variants.map(variant => (
                <option key={variant.id} value={variant.id}>
                  {variant.storage}
                </option>
              ))}
            </Select>
            {!formData.product_id && (
              <p className="text-sm text-muted-foreground">Select a product first</p>
            )}
            <p className="text-xs text-muted-foreground">
              Price is determined by storage. Colors are options available for each storage.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="store_id">Store *</Label>
            <Select
              id="store_id"
              name="store_id"
              value={formData.store_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a store</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (AED) *</Label>
            <Input
              id="price"
              name="price"
              type="text"
              inputMode="decimal"
              pattern="^[0-9]*([.][0-9]{0,2})?$"
              value={formData.price}
              onChange={handleChange}
              required
              placeholder="e.g., 3999.00"
              className="text-lg font-semibold"
            />
            <p className="text-sm text-muted-foreground">
              Current price for this product variant at this store
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliate_url">Affiliate URL</Label>
            <Input
              id="affiliate_url"
              name="affiliate_url"
              type="url"
              value={formData.affiliate_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : priceId ? 'Update Price' : 'Add Price'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/prices')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
