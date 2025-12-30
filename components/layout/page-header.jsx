import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export function PageHeader({ title, description, action, actions }) {
  const actionList = actions || (action ? [action] : [])
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/50 mb-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm sm:text-base">{description}</p>
        )}
      </div>
      {actionList.length > 0 && (
        <div className="flex gap-2">
          {actionList.map((btn, idx) => (
            <Link key={idx} href={btn.href}>
              <Button variant={btn.variant || 'default'} className="gap-2">
                <Plus className="h-4 w-4" />
                {btn.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
