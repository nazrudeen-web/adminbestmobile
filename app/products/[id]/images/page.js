'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/shared/image-upload"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { Trash2, Star, StarOff } from "lucide-react"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import Image from "next/image"

export default function ProductImagesPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [productId, setProductId] = useState(null)
  const [product, setProduct] = useState(null)
  const [allImages, setAllImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteImage, setDeleteImage] = useState(null)
  const [uploadKey, setUploadKey] = useState(0)

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
      const [productRes, imagesRes, storageRes] = await Promise.all([
        supabase.from('products').select('*, brands(name)').eq('id', productId).single(),
        supabase.from('product_images').select('*').eq('product_id', productId).order('sort_order'),
        supabase.storage.from('products').list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })
      ])

      if (productRes.error) throw productRes.error

      setProduct(productRes.data)

      // Collect all images: from product_images table + main_image + storage bucket
      const imagesList = []
      const seenUrls = new Set()

      // Add images from product_images table
      if (imagesRes.data) {
        for (const img of imagesRes.data) {
          seenUrls.add(img.image_url)
          imagesList.push({
            id: img.id,
            image_url: img.image_url,
            file_name: img.image_url.split('/').pop(),
            is_main: productRes.data.main_image === img.image_url,
            created_at: img.created_at,
            in_database: true
          })
        }
      }

      // Add main_image if not already in list
      if (productRes.data.main_image && !seenUrls.has(productRes.data.main_image)) {
        seenUrls.add(productRes.data.main_image)
        imagesList.push({
          id: 'main-' + Date.now(),
          image_url: productRes.data.main_image,
          file_name: productRes.data.main_image.split('/').pop(),
          is_main: true,
          created_at: productRes.data.created_at,
          in_database: false
        })
      }

      // Add all storage images (so user can see and manage all bucket images)
      if (storageRes.data) {
        for (const file of storageRes.data) {
          if (file.name && !file.name.includes('.emptyFolderPlaceholder')) {
            const { data: { publicUrl } } = supabase.storage
              .from('products')
              .getPublicUrl(file.name)
            
            if (!seenUrls.has(publicUrl)) {
              seenUrls.add(publicUrl)
              imagesList.push({
                id: file.id || file.name,
                image_url: publicUrl,
                file_name: file.name,
                is_main: productRes.data.main_image === publicUrl,
                created_at: file.created_at,
                in_database: false
              })
            }
          }
        }
      }

      // Sort by creation date (newest first)
      imagesList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setAllImages(imagesList)
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

  const handleImageUpload = async (url) => {
    setUploading(true)
    try {
      // Save to product_images table to associate with this product
      await supabase
        .from('product_images')
        .insert([{
          product_id: productId,
          image_url: url,
          is_main: allImages.length === 0,
          sort_order: allImages.length
        }])

      // If this is the first image, set it as main automatically
      if (allImages.length === 0) {
        await supabase
          .from('products')
          .update({ main_image: url })
          .eq('id', productId)
      }

      toast({
        title: "Success",
        description: allImages.length === 0 ? "Image uploaded and set as main image" : "Image uploaded successfully"
      })
      
  setUploadKey(prev => prev + 1)
      fetchData()
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSetMainImage = async (imageUrl) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ main_image: imageUrl })
        .eq('id', productId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Main image updated"
      })
      fetchData()
    } catch (error) {
      console.error('Error setting main image:', error)
      toast({
        title: "Error",
        description: "Failed to set main image",
        variant: "destructive"
      })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteImage) return

    try {
      const { error } = await supabase.storage
        .from('products')
        .remove([deleteImage.file_name])

      if (error) throw error

      // If deleted image was main, clear main_image from product
      if (deleteImage.is_main) {
        await supabase
          .from('products')
          .update({ main_image: null })
          .eq('id', productId)
      }

      toast({
        title: "Success",
        description: "Image deleted successfully"
      })
      setDeleteImage(null)
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
        <p className="text-sm text-muted-foreground mt-1">
          Upload images, set main image, and manage all product photos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Image</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
                        key={uploadKey}
            bucket="products"
            value=""
            onChange={handleImageUpload}
          />
          {allImages.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              The first image you upload will automatically be set as the main image
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Images ({allImages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {allImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No images uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-1">Upload your first image above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allImages.map((image) => (
                <div 
                  key={image.id} 
                  className={`relative border-2 rounded-lg p-2 ${image.is_main ? 'border-primary' : 'border-border'}`}
                >
                  <div className="aspect-square relative mb-2 rounded overflow-hidden bg-muted">
                    {image.image_url.includes('supabase.co') ? (
                      <Image
                        src={image.image_url}
                        alt="Product"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <img
                        src={image.image_url}
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    {image.is_main ? (
                      <span className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        <Star className="h-3 w-3 fill-current" />
                        Main
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleSetMainImage(image.image_url)}
                      >
                        <StarOff className="h-3 w-3 mr-1" />
                        Set Main
                      </Button>
                    )}
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setDeleteImage(image)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2 truncate" title={image.file_name}>
                    {image.file_name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => router.push('/products')}>
        Back to Products
      </Button>

      <DeleteDialog
        open={!!deleteImage}
        onOpenChange={(open) => !open && setDeleteImage(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Image"
        description={`Are you sure you want to delete this image${deleteImage?.is_main ? ' (Main Image)' : ''}? This action cannot be undone.`}
      />
    </div>
  )
}
