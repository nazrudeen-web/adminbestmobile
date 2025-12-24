import { PageHeader } from "@/components/layout/page-header"
import { StoreForm } from "@/components/forms/store-form"

export default function NewStorePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Store"
        description="Add a new partner store"
      />
      <StoreForm />
    </div>
  )
}
