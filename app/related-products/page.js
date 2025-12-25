import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/page-header"
import { RelatedProductsTable } from "@/components/tables/related-products-table"

async function getRelatedProducts() {
  const { data, error } = await supabase
    .from('related_products')
    .select(`
      *,
      product:product_id(id, name, brands(name)),
      related_product:related_product_id(id, name, brands(name), best_price)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching related products:', error)
    return []
  }

  return data
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
