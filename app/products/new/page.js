import { PageHeader } from "@/components/layout/page-header"
import { ProductForm } from "@/components/forms/product-form"

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Product"
        description="Add a new mobile phone product"
      />
      <ProductForm />
    </div>
  )
}
