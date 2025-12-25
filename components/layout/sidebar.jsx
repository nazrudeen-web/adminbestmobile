'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  Store, 
  DollarSign,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  Smartphone
} from "lucide-react"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Brands", href: "/brands", icon: Tag },
  { name: "Products", href: "/products", icon: Package },
  { name: "Similar Phones", href: "/related-products", icon: GitCompare },
  { name: "Stores", href: "/stores", icon: Store },
  { name: "Prices", href: "/prices", icon: DollarSign },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "flex flex-col bg-card border-r border-border/50 transition-all duration-300 ease-in-out shadow-sm",
        collapsed ? "w-[72px]" : "w-72"
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">Best Mobile</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Admin Panel</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto">
            <Smartphone className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 mt-2">
        <div className={cn("mb-4", collapsed && "hidden")}>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Menu
          </span>
        </div>
        {navigation.map((item, index) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "animate-slideIn",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary-foreground")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Button */}
      <div className="border-t border-border/50 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
            "text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
