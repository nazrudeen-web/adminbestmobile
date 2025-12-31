import { supabase } from "@/lib/supabase"
import { PricesTable } from "@/components/tables/prices-table"

// Always fetch fresh prices; avoid build-time caching
export const revalidate = 0

async function getPrices() {
  try {
    const { data, error } = await supabase
      .from('prices')
      .select(`
        *,
        products(id, name),
        product_variants(id, storage),
        stores(id, name, is_official, is_authorized_seller)
      `)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching prices:', error)
      // Fallback: fetch without relationships to surface data even if a relation fails
      const fallback = await supabase
        .from('prices')
        .select('*')
        .order('updated_at', { ascending: false })
      if (fallback.error) {
        console.error('Fallback prices fetch failed:', fallback.error)
        return []
      }
      return fallback.data || []
    }

    return data || []
  } catch (e) {
    console.error('Error fetching prices (exception):', e)
    return []
  }
}

export default async function PricesPage() {
  const prices = await getPrices()

  return (
    <PricesTable initialPrices={prices} />
  )
}
