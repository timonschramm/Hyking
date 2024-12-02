"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, LogOut, User, Settings, Instagram } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from '@/utils/supabase/client';

const navItems = [
  { name: "Home", href: "/dashboard/", icon: Home },
  { name: "Search", href: "/dashboard/search", icon: Search },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
];

// Helper function to truncate email
const truncateEmail = (email: string, maxLength: number = 20) => {
  if (!email) return '';
  if (email.length <= maxLength) return email;
  
  const [username, domain] = email.split('@');
  if (!domain) return email.slice(0, maxLength) + '...';
  
  const truncatedEmail = email.slice(0, maxLength - 3) + '...'; // -3 for '...'
  return truncatedEmail;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string; image?: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
      if (supabaseUser && !error) {
        setUser({
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.name,
          image: supabaseUser.user_metadata?.avatar_url
        });
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.name,
          image: session.user.user_metadata?.avatar_url
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Update the dropdown menu content to use truncated email
  const dropdownContent = (
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel>
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{user?.name || "Account"}</p>
          <p className="text-xs leading-none text-muted-foreground">
            {user?.email ? truncateEmail(user.email) : "user@example.com"}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <User className="mr-2 h-4 w-4" />
        <span>Profile</span>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar for larger screens */}
      <nav className="hidden md:flex flex-col w-64 bg-background border-r p-4">
        <ul className="space-y-2 flex-grow">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center p-2 rounded-md",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="w-6 h-6 mr-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <Avatar className="w-10 h-10 mr-4">
                  <AvatarImage src={user?.image || "/placeholder-avatar.jpg"} alt="User" />
                  <AvatarFallback>{user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">
                  {user?.name || truncateEmail(user?.email || '') || "Account"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            {dropdownContent}
          </DropdownMenu>
        </div>
      </nav>

      <div className="flex-grow overflow-auto">
        {children}
      </div>

      {/* Bottom navigation for mobile */}
      <nav className="z-50 fixed bottom-0 left-0 right-0 md:hidden bg-background border-t">
        <ul className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full text-xs",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="mt-1">{item.name}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-16">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.image || "/placeholder-avatar.jpg"} alt="User" />
                    <AvatarFallback>{user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              {dropdownContent}
            </DropdownMenu>
          </li>
        </ul>
      </nav>
    </div>
  );
}