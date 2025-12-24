import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/layout/page-header"
import { StoresTable } from "@/components/tables/stores-table"

async function getStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching stores:', error)
    return []
  }

  return data
}

export default async function StoresPage() {
  const stores = await getStores()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stores"
        description="Manage partner stores"
        action={{ label: "Add Store", href: "/stores/new" }}
      />
      <StoresTable initialStores={stores} />
    </div>
  )
}
