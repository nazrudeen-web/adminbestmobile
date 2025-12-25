import "./globals.css"
import { Geist } from "next/font/google"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ToastProvider } from "@/components/ui/toast"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

export const metadata = {
  title: "Best Mobile Admin Panel",
  description: "Admin panel for managing mobile phones, brands, stores, and prices",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className={`${geist.className} antialiased bg-background text-foreground`}>
        <ToastProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-8">
                <div className="animate-fadeIn max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
