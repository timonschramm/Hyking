"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Bell, LogOut, User, Settings, Instagram } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from '@/utils/supabase/client';
import Sidebar from "@/app/components/Sidebar";
import NavigationBottomBar from "@/app/components/NavigationBottomBar";

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
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string; image?: string } | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isChatWindowOpen, setIsChatWindowOpen] = useState<boolean>(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
      if (supabaseUser && !error) {
        try {
          const response = await fetch('/apinextjs/profile/image');
          if (!response.ok) {
            throw new Error('Failed to fetch profile');
          }
          const profileData = await response.json();
          
          setUser({
            email: profileData.email,
            name: profileData.email ? profileData.email.split('@')[0] : 'User',
            image: profileData.imageUrl
          });
        } catch (error) {
          console.error('Error fetching profile data:', error);
          // Fallback to session data if API fails
          setUser({
            email: supabaseUser.email,
            name: supabaseUser.email ? supabaseUser.email.split('@')[0] : 'User',
            image: supabaseUser.user_metadata?.avatar_url
          });
        }
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const response = await fetch('/apinextjs/profile/image');
          if (!response.ok) {
            throw new Error('Failed to fetch profile');
          }
          const profileData = await response.json();
          
          setUser({
            email: profileData.email,
            name: profileData.email ? profileData.email.split('@')[0] : 'User',
            image: profileData.imageUrl
          });
        } catch (error) {
          console.error('Error fetching profile data:', error);
          // Fallback to session data if API fails
          setUser({
            email: session.user.email,
            name: session.user.email ? session.user.email.split('@')[0] : 'User',
            image: session.user.user_metadata?.avatar_url
          });
        }
      } else {
        setUser(null);
      }
    });

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Assuming 768px is the breakpoint for mobile
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    // Listen for chat window state changes
    const handleChatWindowState = (event: any) => {
      setIsChatWindowOpen(event.detail.isOpen);
    };

    window.addEventListener('chatWindowStateChange', handleChatWindowState);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('chatWindowStateChange', handleChatWindowState);
    };
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Update the dropdown menu content to use truncated email
  const dropdownContent = (
    <DropdownMenuContent align="end" className="w-56 bg-white text-primary">
      <DropdownMenuLabel>
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{user?.name || "Account"}</p>
          <p className="text-xs leading-none text-primary-medium">
            {user?.email ? truncateEmail(user.email) : "user@example.com"}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-secondary-sage" />
      <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
        <User className="mr-2 h-4 w-4" />
        <span>Profile</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <div className="bg-white text-primary">
      {isMobile ? (
        // Mobile view
        <>
          <div className="fixed inset-0 flex flex-col w-screen">
            <div className={`flex-1 ${pathname.includes('/dashboard/chats/') ? 'h-screen' : pathname === '/dashboard/match' ? 'overflow-hidden' : 'overflow-y-auto pb-16'} bg-white`}>
              {children}
            </div>
            {!pathname.includes('/dashboard/chats/') && (
              <NavigationBottomBar user={user} dropdownContent={dropdownContent} />
            )}
          </div>
        </>
      ) : (
        // Desktop view
        <>
          <div className="flex h-screen bg-white">
            <Sidebar user={user} dropdownContent={dropdownContent} />
            <div className={`flex-grow ${pathname === '/dashboard/match' ? 'overflow-hidden' : 'overflow-y-auto'} bg-white`}>
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}