import { PageHeader } from "@/components/layout/page-header"
import { ProductForm } from "@/components/forms/product-form"

export default async function EditProductPage({ params }) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Product"
        description="Update product information"
      />
      <ProductForm productId={id} />
    </div>
  )
}
