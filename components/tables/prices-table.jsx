'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { formatDate, formatPrice } from "@/lib/utils"
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
import { Edit, Trash2, Search, ExternalLink } from "lucide-react"

export function PricesTable({ initialPrices }) {
  const router = useRouter()
  const { toast } = useToast()
  const [prices, setPrices] = useState(initialPrices)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filteredPrices = prices.filter(price =>
    price.products?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    price.stores?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('prices')
        .delete()
        .eq('id', deleteId)

      if (error) throw error

      setPrices(prices.filter(p => p.id !== deleteId))
      toast({
        title: "Success",
        description: "Price deleted successfully"
      })
      setDeleteId(null)
      router.refresh()
    } catch (error) {
      console.error('Error deleting price:', error)
      toast({
        title: "Error",
        description: "Failed to delete price",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const getStockBadgeVariant = (status) => {
    switch (status) {
      case 'in_stock': return 'default'
      case 'out_of_stock': return 'destructive'
      case 'pre_order': return 'secondary'
      default: return 'default'
    }
  }

  const getStockLabel = (status) => {
    switch (status) {
      case 'in_stock': return 'In Stock'
      case 'out_of_stock': return 'Out of Stock'
      case 'pre_order': return 'Pre-order'
      default: return status
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prices..."
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
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No prices found
                </TableCell>
              </TableRow>
            ) : (
              filteredPrices.map((price) => (
                <TableRow key={price.id}>
                  <TableCell className="font-medium">
                    {price.products?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {price.product_variants?.storage} - {price.product_variants?.color}
                  </TableCell>
                  <TableCell>{price.stores?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{formatPrice(price.price)}</span>
                      {price.old_price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(price.old_price)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStockBadgeVariant(price.stock_status)}>
                      {getStockLabel(price.stock_status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(price.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {price.affiliate_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(price.affiliate_url, '_blank')}
                          title="Visit Store"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/prices/${price.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(price.id)}
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

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Price"
        description="Are you sure you want to delete this price entry?"
      />
    </div>
  )
}
