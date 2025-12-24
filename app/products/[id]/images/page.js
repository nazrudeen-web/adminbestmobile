'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/shared/image-upload"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { Switch } from "@/components/ui/switch"
import { Trash2 } from "lucide-react"

export default function ProductImagesPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [productId, setProductId] = useState(null)
  const [product, setProduct] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newImage, setNewImage] = useState({
    image_url: '',
    is_main: false,
    sort_order: 0
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
      const [productRes, imagesRes] = await Promise.all([
        supabase.from('products').select('*, brands(name)').eq('id', productId).single(),
        supabase.from('product_images').select('*').eq('product_id', productId).order('sort_order')
      ])

      if (productRes.error) throw productRes.error
      if (imagesRes.error) throw imagesRes.error

      setProduct(productRes.data)
      setImages(imagesRes.data || [])
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

  const handleAddImage = async () => {
    if (!newImage.image_url) {
      toast({
        title: "Error",
        description: "Please upload an image",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('product_images')
        .insert([{
          product_id: productId,
          ...newImage
        }])

      if (error) throw error

      toast({
        title: "Success",
        description: "Image added successfully"
      })

      setNewImage({ image_url: '', is_main: false, sort_order: images.length })
      fetchData()
    } catch (error) {
      console.error('Error adding image:', error)
      toast({
        title: "Error",
        description: "Failed to add image",
        variant: "destructive"
      })
    }
  }

  const handleDeleteImage = async (imageId) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Image deleted successfully"
      })
      fetchData()
    } catch (error) {
      console.error('Error deleting image:', error)
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive"
      })
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Images</h1>
        <p className="text-muted-foreground mt-2">
          {product?.brands?.name} - {product?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Image</Label>
            <ImageUpload
              bucket="products"
              value={newImage.image_url}
              onChange={(url) => setNewImage(prev => ({ ...prev, image_url: url }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={newImage.is_main}
              onCheckedChange={(checked) => 
                setNewImage(prev => ({ ...prev, is_main: checked }))
              }
            />
            <Label>Set as main image</Label>
          </div>

          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={newImage.sort_order}
              onChange={(e) => setNewImage(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <Button onClick={handleAddImage}>Add Image</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Images ({images.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative border rounded-lg p-2">
                <div className="aspect-square relative mb-2">
                  <img
                    src={image.image_url}
                    alt="Product"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                {image.is_main && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Main
                  </span>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleDeleteImage(image.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {images.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No images added yet</p>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => router.push('/products')}>
        Back to Products
      </Button>
    </div>
  )
}
