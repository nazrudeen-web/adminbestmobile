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
import { Select } from "@/components/ui/select"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { useToast } from "@/components/ui/toast"
import { Edit, Trash2, Search, ExternalLink, ChevronDown, ChevronRight, Filter, X, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react"

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

export function PricesTable({ initialPrices }) {
  const router = useRouter()
  const { toast } = useToast()
  const [prices, setPrices] = useState(initialPrices)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  
  // New filter states
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [selectedStoreType, setSelectedStoreType] = useState('')
  const [viewMode, setViewMode] = useState('grouped') // 'table' or 'grouped' - DEFAULT: grouped
  const [expandedProducts, setExpandedProducts] = useState(new Set())
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

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

  // Filter prices
  const filteredPrices = useMemo(() => {
    return prices.filter(price => {
      const matchesSearch = searchQuery === '' || 
        price.products?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        price.stores?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        price.product_variants?.storage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        price.product_variants?.color?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesProduct = selectedProduct === '' || price.products?.id === selectedProduct
      const matchesStore = selectedStore === '' || price.stores?.id === selectedStore
      
      let matchesStoreType = true
      if (selectedStoreType === 'official') {
        matchesStoreType = price.stores?.is_official === true
      } else if (selectedStoreType === 'authorized') {
        matchesStoreType = price.stores?.is_authorized_seller === true && !price.stores?.is_official
      } else if (selectedStoreType === 'regular') {
        matchesStoreType = !price.stores?.is_official && !price.stores?.is_authorized_seller
      }
      
      return matchesSearch && matchesProduct && matchesStore && matchesStoreType
    })
  }, [prices, searchQuery, selectedProduct, selectedStore, selectedStoreType])

  // Group prices by product
  const groupedPrices = useMemo(() => {
    const groups = new Map()
    filteredPrices.forEach(price => {
      const productId = price.products?.id || 'unknown'
      const productName = price.products?.name || 'Unknown Product'
      if (!groups.has(productId)) {
        groups.set(productId, { productName, prices: [] })
      }
      groups.get(productId).prices.push(price)
    })
    return Array.from(groups, ([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => a.productName.localeCompare(b.productName))
  }, [filteredPrices])

  // Pagination logic
  const paginatedPrices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredPrices.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredPrices, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredPrices.length / itemsPerPage)

  // Reset to page 1 when filters change
  const handleFilterChange = (setter) => (value) => {
    setter(value)
    setCurrentPage(1)
  }

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
    setExpandedProducts(new Set(groupedPrices.map(g => g.productId)))
  }

  const collapseAll = () => {
    setExpandedProducts(new Set())
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedProduct('')
    setSelectedStore('')
    setSelectedStoreType('')
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery || selectedProduct || selectedStore || selectedStoreType

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

  const Pagination = () => {
    if (totalPages <= 1) return null
    
    return (
      <div className="flex items-center justify-between px-2 py-4 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <Select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="w-20 h-9"
          >
            {ITEMS_PER_PAGE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
          <span>of {filteredPrices.length} entries</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm">Page</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page)
                }
              }}
              className="w-14 h-8 text-center"
            />
            <span className="text-sm">of {totalPages}</span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600">{prices.length}</div>
          <div className="text-sm text-muted-foreground">Total Prices</div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600">{uniqueProducts.length}</div>
          <div className="text-sm text-muted-foreground">Products</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600">{uniqueStores.length}</div>
          <div className="text-sm text-muted-foreground">Stores</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="text-2xl font-bold text-orange-600">{filteredPrices.length}</div>
          <div className="text-sm text-muted-foreground">Filtered Results</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Filters</span>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            <div className="flex items-center gap-1 bg-background rounded-lg border p-1">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-7 px-3"
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'grouped' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grouped')}
                className="h-7 px-3"
              >
                Grouped
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery)(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select
            value={selectedProduct}
            onChange={(e) => handleFilterChange(setSelectedProduct)(e.target.value)}
          >
            <option value="">All Products ({uniqueProducts.length})</option>
            {uniqueProducts.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </Select>
          
          <Select
            value={selectedStore}
            onChange={(e) => handleFilterChange(setSelectedStore)(e.target.value)}
          >
            <option value="">All Stores ({uniqueStores.length})</option>
            {uniqueStores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name} {store.isOfficial ? '(Official)' : store.isAuthorized ? '(Authorized)' : ''}
              </option>
            ))}
          </Select>
          
          <Select
            value={selectedStoreType}
            onChange={(e) => handleFilterChange(setSelectedStoreType)(e.target.value)}
          >
            <option value="">All Store Types</option>
            <option value="official">Official Stores</option>
            <option value="authorized">Authorized Sellers</option>
            <option value="regular">Regular Stores</option>
          </Select>
          
          <Select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
          >
            {ITEMS_PER_PAGE_OPTIONS.map(option => (
              <option key={option} value={option}>{option} per page</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">Variant</TableHead>
                  <TableHead className="font-semibold">Store</TableHead>
                  <TableHead className="font-semibold">Store Type</TableHead>
                  <TableHead className="font-semibold">Price</TableHead>
                  <TableHead className="font-semibold">Updated</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPrices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No prices found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPrices.map((price) => (
                    <TableRow key={price.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {price.products?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm bg-muted px-2 py-1 rounded">
                          {price.product_variants?.storage} - {price.product_variants?.color}
                        </span>
                      </TableCell>
                      <TableCell>{price.stores?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <StoreTypeBadge store={price.stores} />
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-lg">{formatPrice(price.price)}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(price.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <PriceActions price={price} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination />
        </div>
      )}

      {/* Grouped View */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          {groupedPrices.length > 1 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          )}
          
          {groupedPrices.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border rounded-lg">
              No prices found matching your filters
            </div>
          ) : (
            groupedPrices.map(group => (
              <div key={group.productId} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleProductExpand(group.productId)}
                  className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedProducts.has(group.productId) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <span className="font-semibold text-lg">{group.productName}</span>
                    <Badge variant="secondary" className="ml-2">
                      {group.prices.length} price{group.prices.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {new Set(group.prices.map(p => p.stores?.id)).size} store{new Set(group.prices.map(p => p.stores?.id)).size !== 1 ? 's' : ''}
                    </span>
                    <span>
                      {new Set(group.prices.map(p => p.product_variants?.id)).size} variant{new Set(group.prices.map(p => p.product_variants?.id)).size !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium text-foreground">
                      From {formatPrice(Math.min(...group.prices.map(p => p.price)))}
                    </span>
                  </div>
                </button>
                
                {expandedProducts.has(group.productId) && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variant</TableHead>
                          <TableHead>Store</TableHead>
                          <TableHead>Store Type</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.prices
                          .sort((a, b) => a.price - b.price)
                          .map((price) => (
                            <TableRow key={price.id} className="hover:bg-muted/30">
                              <TableCell>
                                <span className="text-sm bg-muted px-2 py-1 rounded">
                                  {price.product_variants?.storage} - {price.product_variants?.color}
                                </span>
                              </TableCell>
                              <TableCell>{price.stores?.name || 'N/A'}</TableCell>
                              <TableCell>
                                <StoreTypeBadge store={price.stores} />
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold text-lg">{formatPrice(price.price)}</span>
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
            ))
          )}
        </div>
      )}

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
