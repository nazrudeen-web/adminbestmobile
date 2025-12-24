import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Best Mobile Admin</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Admin User</span>
      </div>
    </header>
  )
}
