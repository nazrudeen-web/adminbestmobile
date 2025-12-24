'use client'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { X, Upload } from "lucide-react"
import Image from "next/image"

export function ImageUpload({ bucket, value, onChange, className }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || null)

  // Update preview when value prop changes
  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      setPreview(publicUrl)
      onChange(publicUrl)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
  }

  // Check if the URL is from Supabase Storage
  const isSupabaseUrl = preview?.includes('supabase.co')

  return (
    <div className={className}>
      {preview ? (
        <div className="relative w-full h-48 border rounded-md overflow-hidden">
          {isSupabaseUrl ? (
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-md">
          <label className="flex flex-col items-center cursor-pointer">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground mb-2">
              {uploading ? 'Uploading...' : 'Click to upload'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  )
}
