import { Trash2 } from "lucide-react";
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
import { useMining } from "@/contexts/MiningContext";
import { sidebarPages } from "@/routes";

export function AppSidebar() {
  const location = useLocation();
  const { resetData } = useMining();

  return (
    <Sidebar>
      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarPages.map((route) => (
                <SidebarMenuItem key={route.path} className="px-3">
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === route.path}
                    className="px-3 py-2 w-full transition-colors duration-200"
                  >
                    <Link to={route.path}>
                      <route.icon className="h-4 w-4 mr-3" />
                      <span className="font-medium">{route.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="px-6 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold mb-2">
            Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="px-3">
                <SidebarMenuButton
                  onClick={resetData}
                  className="px-3 py-2 w-full transition-colors duration-200 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  <span className="font-medium">Clear Data</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}