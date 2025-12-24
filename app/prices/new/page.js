import { PageHeader } from "@/components/layout/page-header"
import { PriceForm } from "@/components/forms/price-form"

export default function NewPricePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Price"
        description="Add a new product price"
      />
      <PriceForm />
    </div>
  )
}
