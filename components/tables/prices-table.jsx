'use client'

import { useState, useMemo } from "react"
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
import { Edit, Trash2, Search, ExternalLink, ChevronDown, ChevronRight, Plus, TrendingDown, DollarSign } from "lucide-react"

export function PricesTable({ initialPrices }) {
  const router = useRouter()
  const { toast } = useToast()
  const [prices, setPrices] = useState(initialPrices)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedProducts, setExpandedProducts] = useState(new Set())

  // Get unique products and stores for filters
  const uniqueProducts = useMemo(() => {
    const products = new Map()
    prices.forEach(price => {
      if (price.products?.id && price.products?.name) {
        products.set(price.products.id, price.products.name)
      }
    })
    return Array.from(products, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [prices])

  const uniqueStores = useMemo(() => {
    const stores = new Map()
    prices.forEach(price => {
      if (price.stores?.id && price.stores?.name) {
        stores.set(price.stores.id, { 
          name: price.stores.name, 
          isOfficial: price.stores.is_official,
          isAuthorized: price.stores.is_authorized_seller 
        })
      }
    })
    return Array.from(stores, ([id, data]) => ({ id, ...data })).sort((a, b) => a.name.localeCompare(b.name))
  }, [prices])

  // Filter prices based on search query only
  const filteredPrices = useMemo(() => {
    return prices.filter(price => {
      if (searchQuery === '') return true
      const search = searchQuery.toLowerCase()
      return (
        price.products?.name.toLowerCase().includes(search) ||
        price.stores?.name.toLowerCase().includes(search) ||
        price.product_variants?.storage?.toLowerCase().includes(search) ||
        price.product_variants?.color?.toLowerCase().includes(search)
      )
    })
  }, [prices, searchQuery])

  // Group prices by product, then by storage variant
  const groupedPrices = useMemo(() => {
    const productGroups = new Map()
    
    // First group by product
    filteredPrices.forEach(price => {
      const productId = price.products?.id || 'unknown'
      const productName = price.products?.name || 'Unknown Product'
      
      if (!productGroups.has(productId)) {
        productGroups.set(productId, { productName, variants: new Map() })
      }
      
      const product = productGroups.get(productId)
      const storage = price.product_variants?.storage || 'Unknown'
      
      if (!product.variants.has(storage)) {
        product.variants.set(storage, [])
      }
      product.variants.get(storage).push(price)
    })
    
    // Convert to array with sorted variants
    return Array.from(productGroups.values())
      .map(product => ({
        ...product,
        variants: Array.from(product.variants.entries())
          .sort(([storageA], [storageB]) => {
            const numA = parseInt(storageA)
            const numB = parseInt(storageB)
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB
            return storageA.localeCompare(storageB)
          })
          .map(([storage, prices]) => ({
            storage,
            prices: prices.sort((a, b) => a.price - b.price)
          }))
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName))
  }, [filteredPrices])

  // Toggle product expand
  const toggleProductExpand = (productId) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProducts(newExpanded)
  }

  const expandAll = () => {
    setExpandedProducts(new Set(groupedPrices.map((g, idx) => idx)))
  }

  const collapseAll = () => {
    setExpandedProducts(new Set())
  }

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

  const StoreTypeBadge = ({ store }) => (
    <div className="flex flex-wrap gap-1">
      {store?.is_official && (
        <Badge className="bg-green-600 text-white">Official</Badge>
      )}
      {store?.is_authorized_seller && !store?.is_official && (
        <Badge variant="secondary">Authorized</Badge>
      )}
      {!store?.is_official && !store?.is_authorized_seller && (
        <Badge variant="outline">Regular</Badge>
      )}
    </div>
  )

  const PriceActions = ({ price }) => (
    <div className="flex justify-end gap-1">
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
  )

  const handleFilterChange = (setter) => (value) => {
    setter(value)
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Price Management</h2>
          <p className="text-sm text-muted-foreground mt-1">View and manage product prices across stores</p>
        </div>
        <Button onClick={() => router.push('/prices/new')} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Add New Price
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{prices.length}</div>
              <div className="text-xs text-muted-foreground">Total Prices</div>
            </div>
            <DollarSign className="h-8 w-8 text-blue-300" />
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{uniqueProducts.length}</div>
              <div className="text-xs text-muted-foreground">Products</div>
            </div>
            <span className="text-3xl">📱</span>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">{uniqueStores.length}</div>
              <div className="text-xs text-muted-foreground">Stores</div>
            </div>
            <span className="text-3xl">🏪</span>
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">{filteredPrices.length}</div>
              <div className="text-xs text-muted-foreground">Filtered Results</div>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-300" />
          </div>
        </div>
      </div>

      {/* Simple Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search product or store..."
          value={searchQuery}
          onChange={(e) => handleFilterChange(setSearchQuery)(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {/* Grouped View */}
      <div className="space-y-4">
        {groupedPrices.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 border rounded-lg">
            No prices found matching your filters
          </div>
        ) : (
          groupedPrices.map(productGroup => (
              <div key={productGroup.productName} className="border rounded-lg overflow-hidden">
                {/* Product Header */}
                <button
                  onClick={() => toggleProductExpand(productGroup.productName)}
                  className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 hover:from-indigo-100 hover:to-blue-100 dark:hover:from-indigo-950/70 dark:hover:to-blue-950/70 transition-all border-b-2 border-indigo-200/50"
                >
                  <div className="flex items-center gap-4">
                    {expandedProducts.has(productGroup.productName) ? (
                      <ChevronDown className="h-6 w-6 text-indigo-600" />
                    ) : (
                      <ChevronRight className="h-6 w-6 text-indigo-600" />
                    )}
                    <span className="font-bold text-xl text-foreground">{productGroup.productName}</span>
                    <Badge className="bg-indigo-600 text-white font-semibold ml-2">
                      {productGroup.variants.reduce((sum, v) => sum + v.prices.length, 0)} prices
                    </Badge>
                  </div>
                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Total Variants</div>
                      <div className="font-bold text-lg">{productGroup.variants.length}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Price Range</div>
                      <div className="font-bold text-green-600">
                        {formatPrice(
                          Math.min(...productGroup.variants.flatMap(v => v.prices.map(p => p.price)))
                        )} - {formatPrice(
                          Math.max(...productGroup.variants.flatMap(v => v.prices.map(p => p.price)))
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Product Content */}
                {expandedProducts.has(productGroup.productName) && (
                  <div className="space-y-3 p-4 bg-muted/10">
                    {productGroup.variants.map((variant, variantIdx) => {
                      const variantKey = `${productGroup.productName}-${variant.storage}`
                      const isExpanded = expandedProducts.has(variantKey)
                      
                      return (
                        <div key={variantKey} className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                          {/* Variant Header */}
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedProducts)
                              if (newExpanded.has(variantKey)) {
                                newExpanded.delete(variantKey)
                              } else {
                                newExpanded.add(variantKey)
                              }
                              setExpandedProducts(newExpanded)
                            }}
                            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-950/60 dark:hover:to-cyan-950/60 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-blue-600" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-blue-600" />
                              )}
                              <Badge className="bg-blue-600 text-white font-bold text-base px-3">
                                {variant.storage}
                              </Badge>
                              <span className="text-muted-foreground text-sm ml-2">{variant.prices.length} stores</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                {formatPrice(Math.min(...variant.prices.map(p => p.price)))} - {formatPrice(Math.max(...variant.prices.map(p => p.price)))}
                              </div>
                            </div>
                          </button>

                          {/* Store List */}
                          {isExpanded && (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                    <TableHead className="font-bold">Store</TableHead>
                                    <TableHead className="font-bold">Store Type</TableHead>
                                    <TableHead className="font-bold">
                                      <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Price
                                      </div>
                                    </TableHead>
                                    <TableHead className="font-bold">Updated</TableHead>
                                    <TableHead className="text-right font-bold">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {variant.prices.map((price) => (
                                    <TableRow key={price.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20">
                                      <TableCell className="font-semibold">{price.stores?.name || 'N/A'}</TableCell>
                                      <TableCell>
                                        <StoreTypeBadge store={price.stores} />
                                      </TableCell>
                                      <TableCell>
                                        <span className="font-bold text-lg text-green-600">{formatPrice(price.price)}</span>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground text-sm">
                                        {formatDate(price.updated_at)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <PriceActions price={price} />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))
          )}
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
