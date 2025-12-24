import { PageHeader } from "@/components/layout/page-header"
import { BrandForm } from "@/components/forms/brand-form"

export default async function EditBrandPage({ params }) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Brand"
        description="Update brand information"
      />
      <BrandForm brandId={id} />
    </div>
  )
}
