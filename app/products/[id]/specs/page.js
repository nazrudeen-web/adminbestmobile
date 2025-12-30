'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { Trash2, Edit2, Save, X } from "lucide-react"
import { DeleteDialog } from "@/components/shared/delete-dialog"

export default function ProductSpecsPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [productId, setProductId] = useState(null)
  const [product, setProduct] = useState(null)
  const [specs, setSpecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    spec_group: '',
    spec_name: '',
    spec_value: '',
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
      const [productRes, specsRes] = await Promise.all([
        supabase.from('products').select('*, brands(name)').eq('id', productId).single(),
        supabase.from('specifications').select('*').eq('product_id', productId).order('spec_group').order('sort_order')
      ])

      if (productRes.error) throw productRes.error
      if (specsRes.error) throw specsRes.error

      setProduct(productRes.data)
      setSpecs(specsRes.data || [])
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const { error } = await supabase
        .from('specifications')
        .insert([{
          product_id: productId,
          ...formData
        }])

      if (error) throw error

      toast({
        title: "Success",
        description: "Specification added successfully"
      })

      setFormData({ spec_group: '', spec_name: '', spec_value: '', sort_order: 0 })
      fetchData()
    } catch (error) {
      console.error('Error adding specification:', error)
      toast({
        title: "Error",
        description: "Failed to add specification",
        variant: "destructive"
      })
    }
  }

  const startEdit = (spec) => {
    setEditingId(spec.id)
    setEditData({
      spec_group: spec.spec_group,
      spec_name: spec.spec_name,
      spec_value: spec.spec_value,
      sort_order: spec.sort_order
    })
  }

  const handleSaveEdit = async (specId) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('specifications')
        .update(editData)
        .eq('id', specId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Specification updated successfully"
      })

      setEditingId(null)
      fetchData()
    } catch (error) {
      console.error('Error updating specification:', error)
      toast({
        title: "Error",
        description: "Failed to update specification",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('specifications')
        .delete()
        .eq('id', deleteId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Specification deleted successfully"
      })
      setDeleteId(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting specification:', error)
      toast({
        title: "Error",
        description: "Failed to delete specification",
        variant: "destructive"
      })
    }
  }

  if (loading) return <LoadingSpinner />

  // Group specs by spec_group
  const groupedSpecs = specs.reduce((acc, spec) => {
    const group = spec.spec_group || 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(spec)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Specifications</h1>
        <p className="text-muted-foreground mt-2">
          {product?.brands?.name} - {product?.name}
        </p>
      </div>

      {/* Add New Specification */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Specification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spec_group">Group *</Label>
                <select
                  id="spec_group"
                  value={formData.spec_group}
                  onChange={(e) => setFormData(prev => ({ ...prev, spec_group: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Category</option>
                  <option value="Display">Display</option>
                  <option value="Performance">Performance</option>
                  <option value="Camera">Camera</option>
                  <option value="Battery">Battery</option>
                  <option value="Connectivity">Connectivity</option>
                  <option value="Design">Design</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spec_name">Name *</Label>
                <Input
                  id="spec_name"
                  value={formData.spec_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, spec_name: e.target.value }))}
                  required
                  placeholder="e.g., Screen Size"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spec_value">Value *</Label>
              <Input
                id="spec_value"
                value={formData.spec_value}
                onChange={(e) => setFormData(prev => ({ ...prev, spec_value: e.target.value }))}
                required
                placeholder="e.g., 6.7 inches"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <Button type="submit">Add Specification</Button>
          </form>
        </CardContent>
      </Card>

      {/* Display Specifications */}
      <div className="space-y-4">
        {Object.keys(groupedSpecs).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No specifications added yet
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedSpecs).map(([group, groupSpecs]) => (
            <Card key={group}>
              <CardHeader>
                <CardTitle className="text-lg">{group} ({groupSpecs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupSpecs.map((spec) => (
                    <div key={spec.id} className="border rounded-lg p-4 space-y-3">
                      {/* Edit Mode */}
                      {editingId === spec.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">
                              Specification Name
                            </label>
                            <Input
                              value={editData.spec_name}
                              onChange={(e) => setEditData(prev => ({ ...prev, spec_name: e.target.value }))}
                              placeholder="e.g., Screen Size"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">
                              Specification Value
                            </label>
                            <Input
                              value={editData.spec_value}
                              onChange={(e) => setEditData(prev => ({ ...prev, spec_value: e.target.value }))}
                              placeholder="e.g., 6.7 inches"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                Category
                              </label>
                              <select
                                value={editData.spec_group}
                                onChange={(e) => setEditData(prev => ({ ...prev, spec_group: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border rounded-md"
                              >
                                <option value="Display">Display</option>
                                <option value="Performance">Performance</option>
                                <option value="Camera">Camera</option>
                                <option value="Battery">Battery</option>
                                <option value="Connectivity">Connectivity</option>
                                <option value="Design">Design</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                Sort Order
                              </label>
                              <Input
                                type="number"
                                value={editData.sort_order}
                                onChange={(e) => setEditData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(spec.id)}
                              disabled={saving}
                              className="flex-1"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{spec.spec_name}</p>
                            <p className="text-sm text-muted-foreground">{spec.spec_value}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEdit(spec)}
                              title="Edit specification"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(spec.id)}
                              title="Delete specification"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Button variant="outline" onClick={() => router.push('/products')}>
        Back to Products
      </Button>

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Specification"
        description="Are you sure you want to delete this specification?"
      />
    </div>
  )
}
