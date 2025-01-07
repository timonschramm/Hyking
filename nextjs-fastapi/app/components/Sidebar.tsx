import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Home, Search, Bell, Mountain, Star, Heart, MessageCircle } from "lucide-react";

const navItems = [
  { name: "Home", href: "/dashboard/", icon: Home },
  { name: "Search", href: "/dashboard/search", icon: Mountain },
  { name: "Matching", href: "/dashboard/match", icon: Star },
  { name: "Liked Me", href: "/dashboard/likedme", icon: Heart },
  { name: "Chats", href: "/dashboard/chats", icon: MessageCircle },
];

function truncateEmail(email: string) {
  return email.length > 20 ? email.substring(0, 20) + '...' : email;
}

export default function Sidebar({ user, dropdownContent }: { user: any; dropdownContent: any }) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-col w-64 text-foreground border-r border-border p-4 dark:bg-primary dark:text-primary-white">
      <ul className="space-y-2 flex-grow">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex rounded-xl items-center p-2 transition-colors",
                  isActive
                    ? "bg-primary text-primary-white dark:bg-primary-white dark:text-primary"
                    : "text-foreground hover:bg-primary hover:text-primary-white dark:text-primary-white dark:hover:bg-primary-white dark:hover:text-primary"
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
            <Button variant="ghost" className="w-full justify-start p-2 hover:bg-primary hover:text-primary-white dark:hover:bg-primary-white dark:hover:text-primary">
              <Avatar className="w-10 h-10 mr-4">
                {user?.imageUrl ? (
                  <AvatarImage src={user.imageUrl} alt={user?.name || 'User'} />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-white dark:bg-primary-white dark:text-primary">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                )}
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
  );
} 