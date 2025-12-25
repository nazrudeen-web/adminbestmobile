import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Tag, Store, DollarSign, GitCompare } from "lucide-react"

async function getDashboardStats() {
  try {
    const [
      { count: productsCount },
      { count: brandsCount },
      { count: storesCount },
      { count: pricesCount },
      { count: relatedProductsCount }
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('stores').select('*', { count: 'exact', head: true }),
      supabase.from('prices').select('*', { count: 'exact', head: true }),
      supabase.from('related_products').select('*', { count: 'exact', head: true })
    ])

    // Get today's price updates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: todayPricesCount } = await supabase
      .from('prices')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', today.toISOString())

    return {
      productsCount: productsCount || 0,
      brandsCount: brandsCount || 0,
      storesCount: storesCount || 0,
      pricesCount: pricesCount || 0,
      todayPricesCount: todayPricesCount || 0,
      relatedProductsCount: relatedProductsCount || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      productsCount: 0,
      brandsCount: 0,
      storesCount: 0,
      pricesCount: 0,
      todayPricesCount: 0,
      relatedProductsCount: 0
    }
  }
}

export default async function Dashboard() {
  const stats = await getDashboardStats()

  const cards = [
    {
      title: "Total Products",
      value: stats.productsCount,
      icon: Package,
      description: "Active products in catalog",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Total Brands",
      value: stats.brandsCount,
      icon: Tag,
      description: "Registered phone brands",
      color: "text-pink-600",
      bgColor: "bg-pink-100"
    },
    {
      title: "Similar Phones",
      value: stats.relatedProductsCount,
      icon: GitCompare,
      description: "Product comparisons",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Total Stores",
      value: stats.storesCount,
      icon: Store,
      description: "Partner stores",
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      title: "Price Updates Today",
      value: stats.todayPricesCount,
      icon: DollarSign,
      description: "Prices updated today",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    }
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your admin panel.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, index) => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center h-40">
            <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Add New Product</p>
          </CardContent>
        </Card>
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center h-40">
            <DollarSign className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Update Prices</p>
          </CardContent>
        </Card>
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center h-40">
            <Store className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Manage Stores</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
