import { PageHeader } from "@/components/layout/page-header"
import { RelatedProductForm } from "@/components/forms/related-product-form"

export default function NewRelatedProductPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Similar Phone"
        description="Link products for comparison"
      />
      <RelatedProductForm />
    </div>
  )
}
