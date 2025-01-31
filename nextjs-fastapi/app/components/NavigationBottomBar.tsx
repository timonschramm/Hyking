import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Home, Mountain, Star, Heart, MessageCircle, Users, Sparkles } from "lucide-react";

const navItems = [
  { name: "Groups", href: "/dashboard/groupmatches", icon: Users },
  // { name: "Search", href: "/dashboard/search", icon: Mountain },
  { name: "Matching", href: "/dashboard/match", icon: Star },
  { name: "Liked Me", href: "/dashboard/likedme", icon: Heart },

  { name: "Chats", href: "/dashboard/chats", icon: MessageCircle },
  { name: "HykingAI", href: "/dashboard/hykingAI", icon: Sparkles },
];

export default function NavigationBottomBar({ user, dropdownContent }: { user: any; dropdownContent: any }) {
  const pathname = usePathname();

  return (
    <nav className="z-50 h-20 fixed bottom-0 left-0 right-0 bg-background border-t pb-4 shadow-lg">
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
                {user?.image ? (
                  <AvatarImage src={user.image} alt="User" />
                ) : (
                  <AvatarFallback>
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              </Button>
            </DropdownMenuTrigger>
            {dropdownContent}
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  );
} 