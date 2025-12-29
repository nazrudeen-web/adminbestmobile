import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/page-header"
import { RelatedProductsTable } from "@/components/tables/related-products-table"

async function getRelatedProducts() {
  try {
    const { data, error } = await supabase
      .from('related_products')
      .select(`
        *,
        product:product_id(id, name, brands(name)),
        related_product:related_product_id(id, name, brands(name))
      `)
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching related products:', error)
      // Fallback: return base rows if relational selection fails
      const fallback = await supabase
        .from('related_products')
        .select('*')
        .order('id', { ascending: false })

      if (fallback.error) {
        console.error('Fallback related products fetch failed:', fallback.error)
        return []
      }
      return fallback.data || []
    }

    return data || []
  } catch (e) {
    console.error('Error fetching related products (exception):', e)
    return []
  }
}

export default async function RelatedProductsPage() {
  const relatedProducts = await getRelatedProducts()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Similar Phones"
        description="Manage product comparisons and similar phone recommendations"
        action={{ label: "Add Similar Phone", href: "/related-products/new" }}
      />
      <RelatedProductsTable initialRelatedProducts={relatedProducts} />
    </div>
  )
}
