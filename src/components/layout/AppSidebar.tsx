import { Home, Trophy } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  {
    title: "Personal Mining",
    url: "/",
    icon: Home,
  },
  {
    title: "Global Leaderboard",
    url: "/leaderboard",
    icon: Trophy,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="px-3">
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="px-3 py-2 w-full transition-colors duration-200"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4 mr-3" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}