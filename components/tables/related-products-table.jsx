'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { useToast } from "@/components/ui/toast"
import { Edit, Trash2, Search, ArrowRight } from "lucide-react"

export function RelatedProductsTable({ initialRelatedProducts }) {
  const router = useRouter()
  const { toast } = useToast()
  const [relatedProducts, setRelatedProducts] = useState(initialRelatedProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filteredRelatedProducts = relatedProducts.filter(rp =>
    rp.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rp.related_product?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('related_products')
        .delete()
        .eq('id', deleteId)

      if (error) throw error

      setRelatedProducts(relatedProducts.filter(rp => rp.id !== deleteId))
      toast({
        title: "Success",
        description: "Similar phone relationship deleted successfully"
      })
      setDeleteId(null)
      router.refresh()
    } catch (error) {
      console.error('Error deleting related product:', error)
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const getTypeBadge = (type) => {
    const badges = {
      similar: { label: 'Similar', variant: 'default' },
      alternative: { label: 'Alternative', variant: 'secondary' },
      upgrade: { label: 'Upgrade', variant: 'default' },
      budget: { label: 'Budget', variant: 'secondary' }
    }
    const badge = badges[type] || badges.similar
    return <Badge variant={badge.variant}>{badge.label}</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Main Product</TableHead>
              <TableHead className="text-center w-20"></TableHead>
              <TableHead>Similar Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRelatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                  No similar phone relationships found. Add some to show product comparisons!
                </TableCell>
              </TableRow>
            ) : (
              filteredRelatedProducts.map((rp) => (
                <TableRow key={rp.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {rp.product?.brands?.name} {rp.product?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">Main Product</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground inline" />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {rp.related_product?.brands?.name} {rp.related_product?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">Similar Alternative</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(rp.type)}
                  </TableCell>
                  <TableCell>
                    {rp.related_product?.best_price ? (
                      <span className="font-semibold">
                        AED {rp.related_product.best_price.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/related-products/${rp.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(rp.id)}
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
      </div>

      {filteredRelatedProducts.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredRelatedProducts.length} relationship(s)
        </div>
      )}

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Similar Phone"
        description="Are you sure you want to remove this similar phone relationship? This won't delete the products themselves."
      />
    </div>
  )
}
