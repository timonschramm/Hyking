import { BottomNav } from "@/app/components/BottomNavigationBar"
import { ResponsiveNav } from "../components/ResponsiveNav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pb-16">
      {children}
      <ResponsiveNav />
    </div>
  )
} 