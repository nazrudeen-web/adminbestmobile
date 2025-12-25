import { PageHeader } from "@/components/layout/page-header"
import { RelatedProductForm } from "@/components/forms/related-product-form"

export default async function EditRelatedProductPage({ params }) {
  const resolvedParams = await params
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Similar Phone"
        description="Update product relationship"
      />
      <RelatedProductForm relatedProductId={resolvedParams.id} />
    </div>
  )
}
