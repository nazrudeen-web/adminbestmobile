import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/page-header"
import { PricesTable } from "@/components/tables/prices-table"

async function getPrices() {
  const { data, error } = await supabase
    .from('prices')
    .select(`
      *,
      products(id, name),
      product_variants(id, storage, color),
      stores(id, name, is_official, is_authorized_seller)
    `)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching prices:', error)
    return []
  }

  return data
}

export default async function PricesPage() {
  const prices = await getPrices()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prices"
        description="Manage product prices across stores"
        action={{ label: "Add Price", href: "/prices/new" }}
      />
      <PricesTable initialPrices={prices} />
    </div>
  )
}
