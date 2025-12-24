import { PageHeader } from "@/components/layout/page-header"
import { BrandForm } from "@/components/forms/brand-form"

export default function NewBrandPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Brand"
        description="Add a new phone brand"
      />
      <BrandForm />
    </div>
  )
}
