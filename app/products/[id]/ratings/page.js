'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { X } from "lucide-react"

export default function ProductRatingsPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [productId, setProductId] = useState(null)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    overall_score: '',
    camera_score: '',
    battery_score: '',
    performance_score: '',
    display_score: '',
    pros: [],
    cons: []
  })
  const [newPro, setNewPro] = useState('')
  const [newCon, setNewCon] = useState('')

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
      const [productRes, ratingRes] = await Promise.all([
        supabase.from('products').select('*, brands(name)').eq('id', productId).single(),
        supabase.from('expert_ratings').select('*').eq('product_id', productId).single()
      ])

      if (productRes.error) throw productRes.error
      
      setProduct(productRes.data)
      
      if (ratingRes.data) {
        setFormData({
          overall_score: ratingRes.data.overall_score?.toString() || '',
          camera_score: ratingRes.data.camera_score?.toString() || '',
          battery_score: ratingRes.data.battery_score?.toString() || '',
          performance_score: ratingRes.data.performance_score?.toString() || '',
          display_score: ratingRes.data.display_score?.toString() || '',
          pros: ratingRes.data.pros || [],
          cons: ratingRes.data.cons || []
        })
      }
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

  const handleAddPro = () => {
    if (newPro.trim()) {
      setFormData(prev => ({
        ...prev,
        pros: [...prev.pros, newPro.trim()]
      }))
      setNewPro('')
    }
  }

  const handleAddCon = () => {
    if (newCon.trim()) {
      setFormData(prev => ({
        ...prev,
        cons: [...prev.cons, newCon.trim()]
      }))
      setNewCon('')
    }
  }

  const handleRemovePro = (index) => {
    setFormData(prev => ({
      ...prev,
      pros: prev.pros.filter((_, i) => i !== index)
    }))
  }

  const handleRemoveCon = (index) => {
    setFormData(prev => ({
      ...prev,
      cons: prev.cons.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const ratingData = {
        product_id: productId,
        overall_score: formData.overall_score ? parseFloat(formData.overall_score) : null,
        camera_score: formData.camera_score ? parseFloat(formData.camera_score) : null,
        battery_score: formData.battery_score ? parseFloat(formData.battery_score) : null,
        performance_score: formData.performance_score ? parseFloat(formData.performance_score) : null,
        display_score: formData.display_score ? parseFloat(formData.display_score) : null,
        pros: formData.pros,
        cons: formData.cons,
        updated_at: new Date().toISOString()
      }

      // Check if rating exists
      const { data: existing } = await supabase
        .from('expert_ratings')
        .select('id')
        .eq('product_id', productId)
        .single()

      let error
      if (existing) {
        const result = await supabase
          .from('expert_ratings')
          .update(ratingData)
          .eq('product_id', productId)
        error = result.error
      } else {
        const result = await supabase
          .from('expert_ratings')
          .insert([ratingData])
        error = result.error
      }

      if (error) throw error

      toast({
        title: "Success",
        description: "Expert rating saved successfully"
      })
    } catch (error) {
      console.error('Error saving rating:', error)
      toast({
        title: "Error",
        description: "Failed to save rating",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expert Ratings</h1>
        <p className="text-muted-foreground mt-2">
          {product?.brands?.name} - {product?.name}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Rating Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="overall_score">Overall Score</Label>
                <Input
                  id="overall_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.overall_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, overall_score: e.target.value }))}
                  placeholder="8.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="camera_score">Camera Score</Label>
                <Input
                  id="camera_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.camera_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, camera_score: e.target.value }))}
                  placeholder="8.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="battery_score">Battery Score</Label>
                <Input
                  id="battery_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.battery_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, battery_score: e.target.value }))}
                  placeholder="9.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="performance_score">Performance Score</Label>
                <Input
                  id="performance_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.performance_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, performance_score: e.target.value }))}
                  placeholder="9.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_score">Display Score</Label>
                <Input
                  id="display_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.display_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_score: e.target.value }))}
                  placeholder="8.8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pros & Cons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Pros</Label>
              <div className="flex gap-2">
                <Input
                  value={newPro}
                  onChange={(e) => setNewPro(e.target.value)}
                  placeholder="Add a pro..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPro())}
                />
                <Button type="button" onClick={handleAddPro}>Add</Button>
              </div>
              <div className="space-y-2">
                {formData.pros.map((pro, index) => (
                  <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded">
                    <span className="flex-1">{pro}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePro(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.pros.length === 0 && (
                  <p className="text-sm text-muted-foreground">No pros added yet</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Cons</Label>
              <div className="flex gap-2">
                <Input
                  value={newCon}
                  onChange={(e) => setNewCon(e.target.value)}
                  placeholder="Add a con..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCon())}
                />
                <Button type="button" onClick={handleAddCon}>Add</Button>
              </div>
              <div className="space-y-2">
                {formData.cons.map((con, index) => (
                  <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded">
                    <span className="flex-1">{con}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCon(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.cons.length === 0 && (
                  <p className="text-sm text-muted-foreground">No cons added yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Rating'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/products')}
          >
            Back to Products
          </Button>
        </div>
      </form>
    </div>
  )
}
