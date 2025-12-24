import { PageHeader } from "@/components/layout/page-header"
import { PriceForm } from "@/components/forms/price-form"

export default async function EditPricePage({ params }) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Price"
        description="Update price information"
      />
      <PriceForm priceId={id} />
    </div>
  )
}
