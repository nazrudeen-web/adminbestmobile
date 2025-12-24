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
import { Trash2, MoveUp, MoveDown } from "lucide-react"
import { DeleteDialog } from "@/components/shared/delete-dialog"

export default function KeySpecificationsPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [productId, setProductId] = useState(null)
  const [product, setProduct] = useState(null)
  const [keySpecs, setKeySpecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [formData, setFormData] = useState({
    icon: '',
    title: '',
    value: '',
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
      const [productRes, keySpecsRes] = await Promise.all([
        supabase.from('products').select('*, brands(name)').eq('id', productId).single(),
        supabase.from('key_specifications').select('*').eq('product_id', productId).order('sort_order')
      ])

      if (productRes.error) throw productRes.error
      if (keySpecsRes.error) throw keySpecsRes.error

      setProduct(productRes.data)
      setKeySpecs(keySpecsRes.data || [])
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
        .from('key_specifications')
        .insert([{
          product_id: productId,
          ...formData
        }])

      if (error) throw error

      toast({
        title: "Success",
        description: "Key specification added successfully"
      })

      setFormData({ icon: '', title: '', value: '', sort_order: keySpecs.length })
      fetchData()
    } catch (error) {
      console.error('Error adding key spec:', error)
      toast({
        title: "Error",
        description: "Failed to add key specification",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('key_specifications')
        .delete()
        .eq('id', deleteId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Key specification deleted successfully"
      })
      setDeleteId(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting key spec:', error)
      toast({
        title: "Error",
        description: "Failed to delete key specification",
        variant: "destructive"
      })
    }
  }

  const updateSortOrder = async (id, newOrder) => {
    try {
      const { error } = await supabase
        .from('key_specifications')
        .update({ sort_order: newOrder })
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error updating sort order:', error)
    }
  }

  const moveUp = (index) => {
    if (index === 0) return
    const spec = keySpecs[index]
    const prevSpec = keySpecs[index - 1]
    updateSortOrder(spec.id, spec.sort_order - 1)
    updateSortOrder(prevSpec.id, prevSpec.sort_order + 1)
  }

  const moveDown = (index) => {
    if (index === keySpecs.length - 1) return
    const spec = keySpecs[index]
    const nextSpec = keySpecs[index + 1]
    updateSortOrder(spec.id, spec.sort_order + 1)
    updateSortOrder(nextSpec.id, nextSpec.sort_order - 1)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Key Specifications</h1>
        <p className="text-muted-foreground mt-2">
          {product?.brands?.name} - {product?.name}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Top highlights shown at the top of the product page (4-6 items recommended)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Key Specification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon Name *</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  required
                  placeholder="e.g., display, processor, storage, battery"
                />
                <p className="text-xs text-muted-foreground">Icon identifier for frontend display</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="e.g., Display, Processor"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                required
                placeholder="e.g., 6.3&quot; OLED, Google Tensor G4"
              />
            </div>

            <Button type="submit">Add Key Specification</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Key Specifications ({keySpecs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Order</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keySpecs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No key specifications added yet
                  </TableCell>
                </TableRow>
              ) : (
                keySpecs.map((spec, index) => (
                  <TableRow key={spec.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{spec.icon}</TableCell>
                    <TableCell>{spec.title}</TableCell>
                    <TableCell>{spec.value}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveDown(index)}
                          disabled={index === keySpecs.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(spec.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => router.push('/products')}>
        Back to Products
      </Button>

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Key Specification"
        description="Are you sure you want to delete this key specification?"
      />
    </div>
  )
}
