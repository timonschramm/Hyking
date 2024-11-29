"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Bell, User } from 'lucide-react'

import { cn } from "@/lib/utils"

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Search", href: "/dashboard/search", icon: Search },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Profile", href: "/dashboard/profile", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <ul className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full text-sm",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="mt-1">{item.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

