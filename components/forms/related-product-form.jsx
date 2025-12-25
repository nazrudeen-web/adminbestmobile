'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import Image from "next/image"

export function RelatedProductForm({ relatedProductId }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(!!relatedProductId)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [formData, setFormData] = useState({
    product_id: '',
    related_product_id: '',
    type: 'similar'
  })

  useEffect(() => {
    fetchProducts()
    if (relatedProductId) {
      fetchRelatedProduct()
    }
  }, [relatedProductId])

  useEffect(() => {
    if (formData.product_id && products.length > 0) {
      const product = products.find(p => p.id === formData.product_id)
      setSelectedProduct(product)
    } else {
      setSelectedProduct(null)
    }
  }, [formData.product_id, products])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, main_image, best_price, brands(name)')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchRelatedProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('related_products')
        .select('*')
        .eq('id', relatedProductId)
        .single()

      if (error) throw error
      setFormData({
        product_id: data.product_id || '',
        related_product_id: data.related_product_id || '',
        type: data.type || 'similar'
      })
    } catch (error) {
      console.error('Error fetching related product:', error)
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      })
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (relatedProductId) {
        const { error } = await supabase
          .from('related_products')
          .update(formData)
          .eq('id', relatedProductId)

        if (error) throw error

        toast({
          title: "Success",
          description: "Similar phone relationship updated successfully"
        })
      } else {
        const { error } = await supabase
          .from('related_products')
          .insert([formData])

        if (error) throw error

        toast({
          title: "Success",
          description: "Similar phone relationship created successfully"
        })
      }

      router.push('/related-products')
      router.refresh()
    } catch (error) {
      console.error('Error saving related product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const availableRelatedProducts = products.filter(p => p.id !== formData.product_id)

  if (fetchingData) {
    return <LoadingSpinner />
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{relatedProductId ? 'Edit Similar Phone' : 'Add Similar Phone'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="product_id">Main Product *</Label>
            <Select
              id="product_id"
              name="product_id"
              value={formData.product_id}
              onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
              required
            >
              <option value="">Select main product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.brands?.name} - {product.name}
                </option>
              ))}
            </Select>
            <p className="text-sm text-muted-foreground">
              The product that will show similar phone recommendations
            </p>
          </div>

          {selectedProduct && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-3">Selected Product:</p>
              <div className="flex items-center gap-3">
                {selectedProduct.main_image && (
                  <div className="relative w-16 h-20 flex-shrink-0">
                    <Image
                      src={selectedProduct.main_image}
                      alt={selectedProduct.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{selectedProduct.brands?.name} {selectedProduct.name}</p>
                  {selectedProduct.best_price && (
                    <p className="text-sm text-muted-foreground">AED {selectedProduct.best_price.toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="related_product_id">Similar Phone *</Label>
            <Select
              id="related_product_id"
              name="related_product_id"
              value={formData.related_product_id}
              onChange={(e) => setFormData(prev => ({ ...prev, related_product_id: e.target.value }))}
              required
              disabled={!formData.product_id}
            >
              <option value="">Select similar phone</option>
              {availableRelatedProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.brands?.name} - {product.name}
                  {product.best_price ? ` - AED ${product.best_price.toLocaleString()}` : ''}
                </option>
              ))}
            </Select>
            <p className="text-sm text-muted-foreground">
              The phone to recommend as a similar alternative
            </p>
            {!formData.product_id && (
              <p className="text-sm text-amber-600">Select main product first</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Relationship Type</Label>
            <Select
              id="type"
              name="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="similar">Similar (Price & Performance)</option>
              <option value="alternative">Alternative</option>
              <option value="upgrade">Upgrade Option</option>
              <option value="budget">Budget Alternative</option>
            </Select>
            <p className="text-sm text-muted-foreground">
              Currently defaults to "similar" - reserved for future filtering
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Add 3-4 similar phones per product to show in the "Compare Similar Phones" section on the product page.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : relatedProductId ? 'Update' : 'Add Similar Phone'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/related-products')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
