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
    old_price: '',
    stock_status: 'in_stock',
    delivery_info: '',
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
        ...data,
        price: data.price?.toString() || '',
        old_price: data.old_price?.toString() || ''
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
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const priceData = {
        product_id: formData.product_id,
        variant_id: formData.variant_id,
        store_id: formData.store_id,
        price: parseFloat(formData.price),
        old_price: formData.old_price ? parseFloat(formData.old_price) : null,
        stock_status: formData.stock_status,
        delivery_info: formData.delivery_info,
        affiliate_url: formData.affiliate_url,
        updated_at: new Date().toISOString()
      }

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
        const { error } = await supabase
          .from('prices')
          .insert([priceData])

        if (error) throw error

        toast({
          title: "Success",
          description: "Price created successfully"
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
            <Label htmlFor="variant_id">Variant *</Label>
            <Select
              id="variant_id"
              name="variant_id"
              value={formData.variant_id}
              onChange={handleChange}
              required
              disabled={!formData.product_id}
            >
              <option value="">Select a variant</option>
              {variants.map(variant => (
                <option key={variant.id} value={variant.id}>
                  {variant.storage} - {variant.color}
                </option>
              ))}
            </Select>
            {!formData.product_id && (
              <p className="text-sm text-muted-foreground">Select a product first</p>
            )}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (AED) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="e.g., 3999.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="old_price">Old Price (AED)</Label>
              <Input
                id="old_price"
                name="old_price"
                type="number"
                step="0.01"
                value={formData.old_price}
                onChange={handleChange}
                placeholder="e.g., 4499.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock_status">Stock Status</Label>
            <Select
              id="stock_status"
              name="stock_status"
              value={formData.stock_status}
              onChange={handleChange}
            >
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="pre_order">Pre-order</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_info">Delivery Info</Label>
            <Input
              id="delivery_info"
              name="delivery_info"
              value={formData.delivery_info}
              onChange={handleChange}
              placeholder="e.g., 1-3 business days"
            />
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
