import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Tag, Store, DollarSign } from "lucide-react"

async function getDashboardStats() {
  try {
    const [
      { count: productsCount },
      { count: brandsCount },
      { count: storesCount },
      { count: pricesCount }
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('stores').select('*', { count: 'exact', head: true }),
      supabase.from('prices').select('*', { count: 'exact', head: true })
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
      todayPricesCount: todayPricesCount || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      productsCount: 0,
      brandsCount: 0,
      storesCount: 0,
      pricesCount: 0,
      todayPricesCount: 0
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
      description: "Active products in catalog"
    },
    {
      title: "Total Brands",
      value: stats.brandsCount,
      icon: Tag,
      description: "Registered phone brands"
    },
    {
      title: "Total Stores",
      value: stats.storesCount,
      icon: Store,
      description: "Partner stores"
    },
    {
      title: "Price Updates Today",
      value: stats.todayPricesCount,
      icon: DollarSign,
      description: "Prices updated today"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to Best Mobile Admin Panel
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
