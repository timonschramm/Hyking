import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Home, Search, Bell } from "lucide-react";

const navItems = [
  { name: "Home", href: "/dashboard/", icon: Home },
  { name: "Search", href: "/dashboard/search", icon: Search },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
];

function truncateEmail(email: string) {
  return email.length > 20 ? email.substring(0, 20) + '...' : email;
}

export default function Sidebar({ user, dropdownContent }: { user: any; dropdownContent: any }) {
  const pathname = usePathname();

  return (
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
  );
} 