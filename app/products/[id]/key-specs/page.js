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
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [scrapedData, setScrapedData] = useState(null)
  const [aiData, setAiData] = useState(null)
  const [scraping, setScraping] = useState(false)
  const [aiReformatting, setAiReformatting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [formData, setFormData] = useState({
    icon: '',
    title: '',
    value: '',
    sort_order: 0
  })

  // Standard key specifications for all mobile phones (in display order)
  const standardKeySpecs = [
    { icon: 'display', title: 'Display', placeholder: 'e.g., 6.8" Dynamic AMOLED 2X, 1-120Hz adaptive', defaultValue: '' },
    { icon: 'processor', title: 'Processor', placeholder: 'e.g., Snapdragon 8 Gen 3', defaultValue: '' },
    { icon: 'camera', title: 'Camera', placeholder: 'e.g., 200MP (f/1.7) + 50MP (f/2.4) + 10MP (f/3.4) + 50MP telephoto | 12MP front', defaultValue: '' },
    { icon: 'battery', title: 'Battery', placeholder: 'e.g., 5000 mAh, 45W fast charging', defaultValue: '' }
  ]

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

  const handleUpdate = async (id, value) => {
    try {
      const { error } = await supabase
        .from('key_specifications')
        .update({ value })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Key specification updated successfully"
      })
      fetchData()
    } catch (error) {
      console.error('Error updating key spec:', error)
      toast({
        title: "Error",
        description: "Failed to update key specification",
        variant: "destructive"
      })
    }
  }

  const initializeStandardSpecs = async () => {
    try {
      const specsToInsert = standardKeySpecs.map((spec, index) => ({
        product_id: productId,
        icon: spec.icon,
        title: spec.title,
        value: spec.defaultValue,
        sort_order: index
      }))

      const { error } = await supabase
        .from('key_specifications')
        .insert(specsToInsert)

      if (error) throw error

      toast({
        title: "Success",
        description: "Standard key specifications initialized (Display, Processor, Camera, Battery)"
      })
      fetchData()
    } catch (error) {
      console.error('Error initializing specs:', error)
      toast({
        title: "Error",
        description: "Failed to initialize key specifications",
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

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const res = await fetch('/api/scrape/gsmareana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', phoneName: searchTerm })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSearchResults(data.results || [])
      toast({ title: 'Search complete', description: `Found ${data.results?.length || 0} matches` })
    } catch (error) {
      console.error('Search error:', error)
      toast({ title: 'Error', description: error.message || 'Search failed', variant: 'destructive' })
    } finally {
      setSearching(false)
    }
  }

  const handleScrape = async (url) => {
    setScraping(true)
    setAiData(null)
    try {
      const res = await fetch('/api/scrape/gsmareana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scrape', phoneUrl: url })
      })
      const data = await res.json()
      if (data.error || data.success === false) throw new Error(data.error || 'Scrape failed')
      setScrapedData(data.data || data)
      toast({ title: 'Specs fetched', description: data.data?.name || 'Scrape completed' })
    } catch (error) {
      console.error('Scrape error:', error)
      toast({ title: 'Error', description: error.message || 'Failed to fetch specs', variant: 'destructive' })
    } finally {
      setScraping(false)
    }
  }

  const isGsmarenaUrl = (value = '') => value.includes('gsmarena.com') && value.includes('.php')

  const handleReformat = async () => {
    if (!scrapedData) {
      toast({ title: 'Missing data', description: 'Fetch from GSMArena first', variant: 'destructive' })
      return
    }
    setAiReformatting(true)
    try {
      const res = await fetch('/api/ai/reformat-specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneData: scrapedData })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'AI reformat failed')
      setAiData(data.data)
      toast({ title: 'AI formatted', description: 'Cleaned key specs ready to import' })
    } catch (error) {
      console.error('AI reformat error:', error)
      toast({ title: 'Error', description: error.message || 'AI failed', variant: 'destructive' })
    } finally {
      setAiReformatting(false)
    }
  }

  const inferIcon = (title = '') => {
    const lower = title.toLowerCase()
    if (lower.includes('display') || lower.includes('screen')) return 'display'
    if (lower.includes('processor') || lower.includes('chip') || lower.includes('cpu')) return 'processor'
    if (lower.includes('camera')) return 'camera'
    if (lower.includes('battery')) return 'battery'
    return 'info'
  }

  const handleImportKeySpecs = async () => {
    const sourceKeySpecs = aiData?.keySpecifications || scrapedData?.keySpecifications || []
    if (!productId || sourceKeySpecs.length === 0) {
      toast({ title: 'Nothing to import', description: 'Run GSMArena fetch (and AI) first', variant: 'destructive' })
      return
    }

    setImporting(true)
    try {
      const rows = sourceKeySpecs.map((spec, idx) => ({
        product_id: productId,
        icon: spec.icon || inferIcon(spec.title),
        title: spec.title || 'Spec',
        value: spec.value || spec.spec_value || '',
        sort_order: idx
      }))

      await supabase.from('key_specifications').delete().eq('product_id', productId)

      const { error } = await supabase.from('key_specifications').insert(rows)
      if (error) throw error

      toast({ title: 'Imported', description: `Saved ${rows.length} key specs` })
      fetchData()
    } catch (error) {
      console.error('Import key specs error:', error)
      toast({ title: 'Error', description: error.message || 'Import failed', variant: 'destructive' })
    } finally {
      setImporting(false)
    }
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
          <CardTitle>Import from GSMArena + AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2 md:col-span-2">
              <Label>Search phone on GSMArena</Label>
              <div className="flex gap-2">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g., Samsung S24 Ultra"
                  disabled={searching}
                />
                <Button onClick={handleSearch} disabled={searching || !searchTerm.trim()}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleScrape(searchTerm)}
                  disabled={scraping || !isGsmarenaUrl(searchTerm)}
                >
                  {scraping ? 'Fetching...' : 'Fetch link'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>AI Reformat</Label>
              <Button onClick={handleReformat} disabled={aiReformatting || !scrapedData} className="w-full">
                {aiReformatting ? 'Formatting...' : 'Clean with AI'}
              </Button>
              <p className="text-xs text-muted-foreground">Runs Groq cleaner to standardize key specs</p>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Search Results</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {searchResults.map((result) => (
                  <div key={result.url} className="border rounded p-3 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{result.name}</p>
                      <p className="text-xs text-muted-foreground break-words">{result.url}</p>
                    </div>
                    <Button size="sm" onClick={() => handleScrape(result.url)} disabled={scraping}>
                      {scraping ? 'Fetching...' : 'Import'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(scrapedData || aiData) && (
            <div className="bg-muted/40 border rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Preview</p>
                  <p className="text-xs text-muted-foreground">{(aiData || scrapedData)?.name || 'Specs ready'}</p>
                </div>
                <Button onClick={handleImportKeySpecs} disabled={importing} size="sm">
                  {importing ? 'Saving...' : 'Save key specs'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {(aiData?.keySpecifications || scrapedData?.keySpecifications || []).slice(0, 6).map((spec, idx) => (
                  <div key={idx} className="border rounded p-2 bg-white">
                    <p className="font-medium">{spec.title}</p>
                    <p className="text-muted-foreground text-xs">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Setup - Standard 4 Key Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Initialize the standard 4 key specifications for this product. You can then fill in the values below.
          </p>
          <Button onClick={initializeStandardSpecs} disabled={keySpecs.length > 0}>
            {keySpecs.length > 0 ? 'Already Initialized' : 'Initialize Standard Key Specs'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Specifications ({keySpecs.length}/4)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {keySpecs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No key specifications added yet. Click "Initialize Standard Key Specs" above to get started.
            </div>
          ) : (
            keySpecs.map((spec, index) => {
              const standardSpec = standardKeySpecs.find(s => s.icon === spec.icon) || {}
              return (
                <div key={spec.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{spec.icon}</span>
                      <h3 className="font-semibold text-lg">{spec.title}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveDown(index)}
                        disabled={index === keySpecs.length - 1}
                        title="Move down"
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(spec.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`value-${spec.id}`}>Value *</Label>
                    <Input
                      id={`value-${spec.id}`}
                      defaultValue={spec.value}
                      onBlur={(e) => {
                        if (e.target.value !== spec.value) {
                          handleUpdate(spec.id, e.target.value)
                        }
                      }}
                      placeholder={standardSpec.placeholder || 'Enter specification value'}
                      className="font-medium"
                    />
                    {standardSpec.placeholder && (
                      <p className="text-xs text-muted-foreground">{standardSpec.placeholder}</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Custom Key Specification</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add additional key specifications beyond the standard 4 if needed.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon Name *</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  required
                  placeholder="e.g., storage, ram, screen"
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
                  placeholder="e.g., Storage, RAM"
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
                placeholder="e.g., 256GB, 12GB"
              />
            </div>

            <Button type="submit">Add Custom Specification</Button>
          </form>
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
