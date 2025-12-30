'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { PageHeader } from '@/components/layout/page-header'
import { Trash2, Search, Check, X, Plus, Zap, Loader } from 'lucide-react'

const STEP = {
  SEARCH: 'search',
  SELECT: 'select',
  PREVIEW: 'preview',
  CONFIRM: 'confirm'
}

export default function ImportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(STEP.SEARCH)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [brands, setBrands] = useState([])
  const [scrapedData, setScrapedData] = useState(null)
  const [editedData, setEditedData] = useState(null)
  const [queue, setQueue] = useState([])
  const [expandedGroups, setExpandedGroups] = useState({})
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [showAiResult, setShowAiResult] = useState(false)
  // Fetch brands on mount
  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setBrands(data || [])
    } catch (error) {
      console.error('Error fetching brands:', error)
      toast({
        title: 'Error',
        description: 'Failed to load brands',
        variant: 'destructive'
      })
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      // Check if input is a GSMArena URL
      const isUrl = searchQuery.includes('gsmarena.com')
      
      if (isUrl) {
        // Direct URL scraping
        const response = await fetch('/api/scrape/gsmareana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'scrape',
            phoneUrl: searchQuery
          })
        })

        const data = await response.json()

        if (!response.ok) throw new Error(data.error)
        if (!data.success) throw new Error(data.error)

        setScrapedData(data.data)
        setEditedData(data.data)
        setStep(STEP.PREVIEW)

        toast({
          title: 'Success',
          description: 'Phone data loaded from URL'
        })
      } else {
        // Regular search
        const response = await fetch('/api/scrape/gsmareana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'search',
            phoneName: searchQuery
          })
        })

        const data = await response.json()

        if (!response.ok) throw new Error(data.error)

        setSearchResults(data.results || [])
        if (data.results.length === 0) {
          toast({
            title: 'No results',
            description: 'Try a different search term or paste a GSMArena URL',
            variant: 'destructive'
          })
        } else {
          setStep(STEP.SELECT)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to search',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPhone = async (phoneUrl) => {
    setLoading(true)
    try {
      const response = await fetch('/api/scrape/gsmareana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scrape',
          phoneUrl
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)
      if (!data.success) throw new Error(data.error)

      setScrapedData(data.data)
      setEditedData(JSON.parse(JSON.stringify(data.data))) // Deep clone
      setStep(STEP.PREVIEW)
    } catch (error) {
      console.error('Scrape error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to scrape phone details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSpec = (index, field, value) => {
    const updated = { ...editedData }
    if (field === 'keySpec') {
      updated.keySpecifications[index].value = value
    } else if (field === 'spec') {
      updated.specifications[index].spec_value = value
    } else if (field === 'variant') {
      updated.variants[index] = value
    } else if (field === 'color') {
      updated.colors[index] = value
    }
    setEditedData(updated)
  }

  const handleRemoveSpec = (index, type) => {
    const updated = { ...editedData }
    if (type === 'keySpec') {
      updated.keySpecifications.splice(index, 1)
    } else if (type === 'spec') {
      updated.specifications.splice(index, 1)
    } else if (type === 'variant') {
      updated.variants.splice(index, 1)
    } else if (type === 'color') {
      updated.colors.splice(index, 1)
    }
    setEditedData(updated)
  }

  const handleAiReformat = async () => {
    if (!editedData) return

    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/reformat-specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneData: editedData
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to reformat with AI')
      }

      setAiResult({
        original: editedData,
        reformatted: data.data,
        tokens: data.usage?.total_tokens
      })
      setShowAiResult(true)

      toast({
        title: 'Success',
        description: `AI reformatted specs (${data.usage?.total_tokens || '?'} tokens)`
      })
    } catch (error) {
      console.error('AI Reformat error:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setAiLoading(false)
    }
  }

  const handleAcceptAiResult = () => {
    if (aiResult?.reformatted) {
      setEditedData(aiResult.reformatted)
      setShowAiResult(false)
      setAiResult(null)
      toast({
        title: 'Success',
        description: 'AI reformatted data applied'
      })
    }
  }

  const handleAddToQueue = async () => {
    if (!selectedBrand) {
      toast({
        title: 'Error',
        description: 'Please select a brand',
        variant: 'destructive'
      })
      return
    }

    const newItem = {
      id: Date.now(),
      productData: editedData,
      brandId: selectedBrand,
      status: 'pending'
    }

    setQueue([...queue, newItem])
    toast({
      title: 'Added to queue',
      description: `"${editedData.name}" added to import queue`
    })

    // Reset for next import
    setStep(STEP.SEARCH)
    setSearchQuery('')
    setScrapedData(null)
    setEditedData(null)
    setSearchResults([])
  }

  const handleSaveQueue = async () => {
    if (queue.length === 0) return

    setLoading(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const item of queue) {
        try {
          const response = await fetch('/api/products/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productData: item.productData,
              brandId: item.brandId
            })
          })

          const data = await response.json()

          if (!response.ok) throw new Error(data.error)

          successCount++
          
          // Update queue item status
          setQueue(prev => 
            prev.map(q => 
              q.id === item.id ? { ...q, status: 'success' } : q
            )
          )
        } catch (error) {
          failCount++
          console.error(`Error saving ${item.productData.name}:`, error)
          setQueue(prev => 
            prev.map(q => 
              q.id === item.id ? { ...q, status: 'error', error: error.message } : q
            )
          )
        }
      }

      toast({
        title: 'Import Complete',
        description: `${successCount} succeeded, ${failCount} failed`
      })

      if (successCount > 0) {
        setTimeout(() => {
          router.push('/products')
          router.refresh()
        }, 2000)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromQueue = (id) => {
    setQueue(queue.filter(item => item.id !== id))
  }

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }))
  }

  const handleAddNewSpec = () => {
    const newSpec = {
      spec_group: 'Performance',
      spec_name: 'New Specification',
      spec_value: '',
      sort_order: 0
    }
    const updated = { ...editedData }
    updated.specifications = [...(updated.specifications || []), newSpec]
    setEditedData(updated)
  }

  const groupedSpecs = editedData?.specifications?.reduce((acc, spec) => {
    if (!acc[spec.spec_group]) {
      acc[spec.spec_group] = []
    }
    acc[spec.spec_group].push(spec)
    return acc
  }, {}) || {}

  if (loading && step === STEP.SEARCH) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Mobile Specs"
        description="Search GSMArena and import phone specifications"
      />

      {/* Queue Display - Always show at top when there are items */}
      {queue.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋 Import Queue ({queue.length})</span>
              <span className="text-sm font-normal text-muted-foreground">
                {queue.filter(q => q.status === 'pending').length} pending, {queue.filter(q => q.status === 'success').length} saved
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-white"
              >
                <div className="flex-1">
                  <p className="font-semibold">{item.productData.name}</p>
                  <p className="text-xs text-muted-foreground">
                    📊 {(item.productData.specifications || []).length} specs | 💾 {(item.productData.variants || []).length} storage options | 🎨 {(item.productData.colors || []).length} colors
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {item.status === 'pending' && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Pending</span>
                  )}
                  {item.status === 'success' && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Saved
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded flex items-center gap-1">
                      <X className="h-3 w-3" />
                      Failed
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromQueue(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button
              onClick={handleSaveQueue}
              disabled={loading || !queue.some(q => q.status === 'pending')}
              className="w-full"
            >
              {loading ? 'Saving...' : `Save All to Database (${queue.filter(q => q.status === 'pending').length})`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search Step */}
      {step === STEP.SEARCH && (
        <Card>
          <CardHeader>
            <CardTitle>Search for Phone</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Search by model name or paste a GSMArena URL for exact results
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Phone Model or GSMArena URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    placeholder="e.g., iPhone 16 Pro OR https://www.gsmarena.com/samsung_galaxy_a36-13497.php"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Tip: Paste the full GSMArena URL for exact results (copy from browser address bar)
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Select Step */}
      {step === STEP.SELECT && searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => handleSelectPhone(result.url)}
                >
                  <p className="font-semibold">{result.name}</p>
                  <p className="text-sm text-muted-foreground">{result.snippet}</p>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setStep(STEP.SEARCH)}
              className="mt-4"
            >
              Back to Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview & Confirm Step */}
      {step === STEP.PREVIEW && editedData && (
        <div className="space-y-4">
          {/* AI Result Display */}
          {showAiResult && aiResult && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">AI Reformatted Specs</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAiResult(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  {aiResult.tokens} tokens used - Review and accept these changes
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Before/After Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Original</h4>
                    <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-60">
                      {JSON.stringify(aiResult.original, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">AI Reformatted</h4>
                    <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-60">
                      {JSON.stringify(aiResult.reformatted, null, 2)}
                    </pre>
                  </div>
                </div>

                {aiResult.reformatted.notes && (
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-sm font-semibold mb-1">AI Notes:</p>
                    <p className="text-sm text-gray-700">{aiResult.reformatted.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleAcceptAiResult}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept & Apply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAiResult(false)}
                  >
                    Discard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Review & Edit Data</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Edit any values before importing
                  </p>
                </div>
                <Button
                  onClick={handleAiReformat}
                  disabled={aiLoading}
                  variant="outline"
                  className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  {aiLoading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Reformatting...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Ask AI to Reformat
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phone Name */}
              <div className="space-y-2">
                <Label htmlFor="phone-name">Phone Name</Label>
                <Input
                  id="phone-name"
                  value={editedData.name}
                  onChange={(e) =>
                    setEditedData({ ...editedData, name: e.target.value })
                  }
                />
              </div>

              {/* Key Specs */}
              <div>
                <Label className="text-base font-semibold">Key Specifications</Label>
                <div className="space-y-3 mt-3">
                  {editedData.keySpecifications?.map((spec, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground">
                          {spec.title}
                        </label>
                        <Input
                          value={spec.value}
                          onChange={(e) =>
                            handleUpdateSpec(idx, 'keySpec', e.target.value)
                          }
                          className="text-sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSpec(idx, 'keySpec')}
                        className="mt-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Specs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">
                    Full Specifications ({editedData.specifications?.length || 0})
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddNewSpec}
                  >
                    + Add Specification
                  </Button>
                </div>

                {/* Grouped Specifications */}
                <div className="space-y-2">
                  {Object.entries(groupedSpecs).map(([group, specs]) => (
                    <div key={group} className="border rounded-lg overflow-hidden">
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full p-3 bg-muted hover:bg-muted/80 flex items-center justify-between font-semibold text-sm transition-colors"
                      >
                        <span>
                          {group} ({specs.length})
                        </span>
                        <span className="text-xs">
                          {expandedGroups[group] ? '▼' : '▶'}
                        </span>
                      </button>

                      {/* Group Specs */}
                      {expandedGroups[group] && (
                        <div className="space-y-2 p-3 bg-white">
                          {specs.map((spec, idx) => {
                            const specIndexInFull = editedData.specifications.findIndex(
                              s => s.spec_group === spec.spec_group && s.spec_name === spec.spec_name
                            )
                            return (
                              <div
                                key={idx}
                                className="p-3 border rounded-lg space-y-2 hover:bg-muted/30 transition-colors"
                              >
                                {/* Spec Name */}
                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                      Spec Name
                                    </label>
                                    <Input
                                      value={spec.spec_name}
                                      onChange={(e) => {
                                        const updated = { ...editedData }
                                        updated.specifications[specIndexInFull].spec_name = e.target.value
                                        setEditedData(updated)
                                      }}
                                      className="text-sm"
                                      placeholder="e.g., Display Size"
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveSpec(specIndexInFull, 'spec')}
                                    className="h-9 w-9"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>

                                {/* Spec Value */}
                                <div>
                                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                    Spec Value
                                  </label>
                                  <Input
                                    value={spec.spec_value}
                                    onChange={(e) => {
                                      const updated = { ...editedData }
                                      updated.specifications[specIndexInFull].spec_value = e.target.value
                                      setEditedData(updated)
                                    }}
                                    className="text-sm"
                                    placeholder="e.g., 6.7 inches"
                                  />
                                </div>

                                {/* Spec Group */}
                                <div>
                                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                                    Category
                                  </label>
                                  <select
                                    value={spec.spec_group}
                                    onChange={(e) => {
                                      const updated = { ...editedData }
                                      updated.specifications[specIndexInFull].spec_group = e.target.value
                                      setEditedData(updated)
                                    }}
                                    className="w-full px-2 py-1 text-sm border rounded-md"
                                  >
                                    <option value="Display">Display</option>
                                    <option value="Performance">Performance</option>
                                    <option value="Camera">Camera</option>
                                    <option value="Battery">Battery</option>
                                    <option value="Connectivity">Connectivity</option>
                                    <option value="Design">Design</option>
                                  </select>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {editedData.specifications?.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground border rounded-lg bg-muted/30">
                    <p className="text-sm">No specifications found</p>
                    <Button size="sm" variant="outline" onClick={handleAddNewSpec} className="mt-2">
                      Add First Specification
                    </Button>
                  </div>
                )}
              </div>

              {/* Storage Variants */}
              {editedData.variants?.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">
                    Storage Options ({editedData.variants.length})
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {editedData.variants.map((variant, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-muted px-3 py-2 rounded"
                      >
                        <Input
                          value={variant}
                          onChange={(e) =>
                            handleUpdateSpec(idx, 'variant', e.target.value)
                          }
                          className="h-8 text-sm w-24"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSpec(idx, 'variant')}
                          className="h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {editedData.colors?.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">
                    Colors ({editedData.colors.length})
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {editedData.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-muted px-3 py-2 rounded"
                      >
                        <Input
                          value={color}
                          onChange={(e) =>
                            handleUpdateSpec(idx, 'color', e.target.value)
                          }
                          className="h-8 text-sm w-32"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSpec(idx, 'color')}
                          className="h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand Selection */}
              <div className="space-y-2">
                <Label htmlFor="brand">Select Brand *</Label>
                <select
                  id="brand"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Choose a brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(STEP.SEARCH)
                    setScrapedData(null)
                    setEditedData(null)
                  }}
                >
                  Back
                </Button>
                <Button onClick={handleAddToQueue} disabled={!selectedBrand}>
                  Add to Queue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
