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
    camera_details: [],
    battery_details: [],
    performance_details: [],
    display_details: [],
    camera_pros: [],
    camera_cons: [],
    battery_pros: [],
    battery_cons: [],
    performance_pros: [],
    performance_cons: [],
    display_pros: [],
    display_cons: []
  })
  const [newCameraPro, setNewCameraPro] = useState('')
  const [newCameraCon, setNewCameraCon] = useState('')
  const [newBatteryPro, setNewBatteryPro] = useState('')
  const [newBatteryCon, setNewBatteryCon] = useState('')
  const [newPerformancePro, setNewPerformancePro] = useState('')
  const [newPerformanceCon, setNewPerformanceCon] = useState('')
  const [newDisplayPro, setNewDisplayPro] = useState('')
  const [newDisplayCon, setNewDisplayCon] = useState('')

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

  // Calculate overall score based on category scores
  useEffect(() => {
    const { camera_score, battery_score, performance_score, display_score } = formData
    
    const scores = [camera_score, battery_score, performance_score, display_score]
      .map(score => parseFloat(score))
      .filter(score => !isNaN(score) && score > 0)
    
    if (scores.length === 4) {
      // Calculate average of all four scores
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
      const roundedAverage = Math.round(average * 10) / 10 // Round to 1 decimal place
      
      setFormData(prev => ({
        ...prev,
        overall_score: roundedAverage.toString()
      }))
    }
  }, [formData.camera_score, formData.battery_score, formData.performance_score, formData.display_score])

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
          camera_details: ratingRes.data.camera_details?.details || [],
          battery_details: ratingRes.data.battery_details?.details || [],
          performance_details: ratingRes.data.performance_details?.details || [],
          display_details: ratingRes.data.display_details?.details || [],
          camera_pros: ratingRes.data.camera_pros || [],
          camera_cons: ratingRes.data.camera_cons || [],
          battery_pros: ratingRes.data.battery_pros || [],
          battery_cons: ratingRes.data.battery_cons || [],
          performance_pros: ratingRes.data.performance_pros || [],
          performance_cons: ratingRes.data.performance_cons || [],
          display_pros: ratingRes.data.display_pros || [],
          display_cons: ratingRes.data.display_cons || []
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

  const handleAddCameraPro = () => {
    if (newCameraPro.trim()) {
      setFormData(prev => ({
        ...prev,
        camera_pros: [...prev.camera_pros, newCameraPro.trim()]
      }))
      setNewCameraPro('')
    }
  }

  const handleAddCameraCon = () => {
    if (newCameraCon.trim()) {
      setFormData(prev => ({
        ...prev,
        camera_cons: [...prev.camera_cons, newCameraCon.trim()]
      }))
      setNewCameraCon('')
    }
  }

  const handleAddBatteryPro = () => {
    if (newBatteryPro.trim()) {
      setFormData(prev => ({
        ...prev,
        battery_pros: [...prev.battery_pros, newBatteryPro.trim()]
      }))
      setNewBatteryPro('')
    }
  }

  const handleAddBatteryCon = () => {
    if (newBatteryCon.trim()) {
      setFormData(prev => ({
        ...prev,
        battery_cons: [...prev.battery_cons, newBatteryCon.trim()]
      }))
      setNewBatteryCon('')
    }
  }

  const handleAddPerformancePro = () => {
    if (newPerformancePro.trim()) {
      setFormData(prev => ({
        ...prev,
        performance_pros: [...prev.performance_pros, newPerformancePro.trim()]
      }))
      setNewPerformancePro('')
    }
  }

  const handleAddPerformanceCon = () => {
    if (newPerformanceCon.trim()) {
      setFormData(prev => ({
        ...prev,
        performance_cons: [...prev.performance_cons, newPerformanceCon.trim()]
      }))
      setNewPerformanceCon('')
    }
  }

  const handleAddDisplayPro = () => {
    if (newDisplayPro.trim()) {
      setFormData(prev => ({
        ...prev,
        display_pros: [...prev.display_pros, newDisplayPro.trim()]
      }))
      setNewDisplayPro('')
    }
  }

  const handleAddDisplayCon = () => {
    if (newDisplayCon.trim()) {
      setFormData(prev => ({
        ...prev,
        display_cons: [...prev.display_cons, newDisplayCon.trim()]
      }))
      setNewDisplayCon('')
    }
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
        camera_details: { details: formData.camera_details },
        battery_details: { details: formData.battery_details },
        performance_details: { details: formData.performance_details },
        display_details: { details: formData.display_details },
        camera_pros: formData.camera_pros,
        camera_cons: formData.camera_cons,
        battery_pros: formData.battery_pros,
        battery_cons: formData.battery_cons,
        performance_pros: formData.performance_pros,
        performance_cons: formData.performance_cons,
        display_pros: formData.display_pros,
        display_cons: formData.display_cons,
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
        <p className="text-sm text-muted-foreground mt-1">
          Rate this product based on price, performance & availability in UAE
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Overall Score */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Expert Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="overall_score">Overall Score (out of 10) *</Label>
              <Input
                id="overall_score"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.overall_score}
                readOnly
                placeholder="Auto-calculated"
                className="max-w-xs text-2xl font-bold bg-muted"
                required
              />
              <p className="text-sm text-muted-foreground">
                ✨ Auto-calculated as average of Camera, Display, Battery, and Performance scores
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Category Ratings */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Camera Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📷 Camera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="camera_score">Score (out of 10) *</Label>
                <Input
                  id="camera_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.camera_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, camera_score: e.target.value }))}
                  placeholder="9.5"
                  className="text-xl font-semibold"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description/Title</Label>
                <Input
                  value={formData.camera_details[0] || ''}
                  onChange={(e) => {
                    const newDetails = [...formData.camera_details]
                    newDetails[0] = e.target.value
                    setFormData(prev => ({ ...prev, camera_details: newDetails }))
                  }}
                  placeholder="e.g., Excellent camera"
                  className="font-medium"
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-700">✓ Pros</Label>
                  {formData.camera_pros.map((pro, index) => (
                    <div key={index} className="flex items-center gap-2 bg-green-50 p-2 rounded">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm flex-1">{pro}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, camera_pros: prev.camera_pros.filter((_, i) => i !== index) }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newCameraPro}
                      onChange={(e) => setNewCameraPro(e.target.value)}
                      placeholder="e.g., Excellent main camera"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCameraPro())}
                      className="text-sm"
                    />
                    <Button type="button" onClick={handleAddCameraPro} size="sm">Add</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-700">✗ Cons</Label>
                  {formData.camera_cons.map((con, index) => (
                    <div key={index} className="flex items-center gap-2 bg-red-50 p-2 rounded">
                      <span className="text-red-600">✗</span>
                      <span className="text-sm flex-1">{con}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, camera_cons: prev.camera_cons.filter((_, i) => i !== index) }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newCameraCon}
                      onChange={(e) => setNewCameraCon(e.target.value)}
                      placeholder="e.g., No OIS listed"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCameraCon())}
                      className="text-sm"
                    />
                    <Button type="button" onClick={handleAddCameraCon} size="sm">Add</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Battery Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔋 Battery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="battery_score">Score (out of 10) *</Label>
                <Input
                  id="battery_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.battery_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, battery_score: e.target.value }))}
                  placeholder="8.8"
                  className="text-xl font-semibold"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description/Title</Label>
                <Input
                  value={formData.battery_details[0] || ''}
                  onChange={(e) => {
                    const newDetails = [...formData.battery_details]
                    newDetails[0] = e.target.value
                    setFormData(prev => ({ ...prev, battery_details: newDetails }))
                  }}
                  placeholder="e.g., All-day battery"
                  className="font-medium"
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-700">✓ Pros</Label>
                  {formData.battery_pros.map((pro, index) => (
                    <div key={index} className="flex items-center gap-2 bg-green-50 p-2 rounded">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm flex-1">{pro}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, battery_pros: prev.battery_pros.filter((_, i) => i !== index) }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newBatteryPro}
                      onChange={(e) => setNewBatteryPro(e.target.value)}
                      placeholder="e.g., Long-lasting battery"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBatteryPro())}
                      className="text-sm"
                    />
                    <Button type="button" onClick={handleAddBatteryPro} size="sm">Add</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-700">✗ Cons</Label>
                  {formData.battery_cons.map((con, index) => (
                    <div key={index} className="flex items-center gap-2 bg-red-50 p-2 rounded">
                      <span className="text-red-600">✗</span>
                      <span className="text-sm flex-1">{con}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, battery_cons: prev.battery_cons.filter((_, i) => i !== index) }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newBatteryCon}
                      onChange={(e) => setNewBatteryCon(e.target.value)}
                      placeholder="e.g., Slow charging speed"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBatteryCon())}
                      className="text-sm"
                    />
                    <Button type="button" onClick={handleAddBatteryCon} size="sm">Add</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚡ Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="performance_score">Score (out of 10) *</Label>
                <Input
                  id="performance_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.performance_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, performance_score: e.target.value }))}
                  placeholder="9.5"
                  className="text-xl font-semibold"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description/Title</Label>
                <Input
                  value={formData.performance_details[0] || ''}
                  onChange={(e) => {
                    const newDetails = [...formData.performance_details]
                    newDetails[0] = e.target.value
                    setFormData(prev => ({ ...prev, performance_details: newDetails }))
                  }}
                  placeholder="e.g., Excellent performance"
                  className="font-medium"
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-700">✓ Pros</Label>
                  {formData.performance_pros.map((pro, index) => (
                    <div key={index} className="flex items-center gap-2 bg-green-50 p-2 rounded">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm flex-1">{pro}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, performance_pros: prev.performance_pros.filter((_, i) => i !== index) }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newPerformancePro}
                      onChange={(e) => setNewPerformancePro(e.target.value)}
                      placeholder="e.g., Smooth multitasking"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPerformancePro())}
                      className="text-sm"
                    />
                    <Button type="button" onClick={handleAddPerformancePro} size="sm">Add</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-700">✗ Cons</Label>
                  {formData.performance_cons.map((con, index) => (
                    <div key={index} className="flex items-center gap-2 bg-red-50 p-2 rounded">
                      <span className="text-red-600">✗</span>
                      <span className="text-sm flex-1">{con}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, performance_cons: prev.performance_cons.filter((_, i) => i !== index) }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newPerformanceCon}
                      onChange={(e) => setNewPerformanceCon(e.target.value)}
                      placeholder="e.g., Heats up under load"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPerformanceCon())}
                      className="text-sm"
                    />
                    <Button type="button" onClick={handleAddPerformanceCon} size="sm">Add</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📱 Display
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_score">Score (out of 10) *</Label>
                <Input
                  id="display_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.display_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_score: e.target.value }))}
                  placeholder="9.4"
                  className="text-xl font-semibold"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description/Title</Label>
                <Input
                  value={formData.display_details[0] || ''}
                  onChange={(e) => {
                    const newDetails = [...formData.display_details]
                    newDetails[0] = e.target.value
                    setFormData(prev => ({ ...prev, display_details: newDetails }))
                  }}
                  placeholder="e.g., Excellent display"
                  className="font-medium"
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-700">✓ Pros</Label>
                  {formData.display_pros.map((pro, index) => (
                    <div key={index} className="flex items-center gap-2 bg-green-50 p-2 rounded">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm flex-1">{pro}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, display_pros: prev.display_pros.filter((_, i) => i !== index) }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newDisplayPro}
                      onChange={(e) => setNewDisplayPro(e.target.value)}
                      placeholder="e.g., High refresh rate"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDisplayPro())}
                      className="text-sm"
                    />
                    <Button type="button" onClick={handleAddDisplayPro} size="sm">Add</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-700">✗ Cons</Label>
                  {formData.display_cons.map((con, index) => (
                    <div key={index} className="flex items-center gap-2 bg-red-50 p-2 rounded">
                      <span className="text-red-600">✗</span>
                      <span className="text-sm flex-1">{con}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, display_cons: prev.display_cons.filter((_, i) => i !== index) }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newDisplayCon}
                      onChange={(e) => setNewDisplayCon(e.target.value)}
                      placeholder="e.g., Mediocre brightness"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDisplayCon())}
                      className="text-sm"
                    />
                    <Button type="button" onClick={handleAddDisplayCon} size="sm">Add</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
