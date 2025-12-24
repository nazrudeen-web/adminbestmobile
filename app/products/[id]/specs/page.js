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
import { Trash2 } from "lucide-react"
import { DeleteDialog } from "@/components/shared/delete-dialog"

export default function ProductSpecsPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [productId, setProductId] = useState(null)
  const [product, setProduct] = useState(null)
  const [specs, setSpecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
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

      <Card>
        <CardHeader>
          <CardTitle>Add New Specification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spec_group">Group *</Label>
                <Input
                  id="spec_group"
                  value={formData.spec_group}
                  onChange={(e) => setFormData(prev => ({ ...prev, spec_group: e.target.value }))}
                  required
                  placeholder="e.g., Display, Camera"
                />
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
                <CardTitle>{group}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupSpecs.map((spec) => (
                      <TableRow key={spec.id}>
                        <TableCell className="font-medium">{spec.spec_name}</TableCell>
                        <TableCell>{spec.spec_value}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(spec.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
