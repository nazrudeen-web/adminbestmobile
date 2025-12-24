import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/page-header"
import { BrandsTable } from "@/components/tables/brands-table"

async function getBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching brands:', error)
    return []
  }

  return data
}

export default async function BrandsPage() {
  const brands = await getBrands()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands"
        description="Manage phone brands"
        action={{ label: "Add Brand", href: "/brands/new" }}
      />
      <BrandsTable initialBrands={brands} />
    </div>
  )
}
