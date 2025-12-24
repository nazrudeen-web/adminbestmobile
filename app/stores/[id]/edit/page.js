import { PageHeader } from "@/components/layout/page-header"
import { StoreForm } from "@/components/forms/store-form"

export default async function EditStorePage({ params }) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Store"
        description="Update store information"
      />
      <StoreForm storeId={id} />
    </div>
  )
}
