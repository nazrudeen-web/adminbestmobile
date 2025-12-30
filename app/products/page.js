import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/page-header"
import { ProductsTable } from "@/components/tables/products-table"

async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, brands(id, name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage mobile phone products"
        actions={[
          { label: "Import from GSMArena", href: "/products/import", variant: "outline" },
          { label: "Add Product", href: "/products/new" }
        ]}
      />
      <ProductsTable initialProducts={products} />
    </div>
  )
}
