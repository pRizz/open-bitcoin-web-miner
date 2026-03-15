import React from "react";
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
import { useLocation } from "react-router-dom";
import { useMining } from "@/contexts/MiningContext";
import { sidebarPages } from "@/routes";
import { TypedLink } from "@/components/TypedLink";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useSidebar } from "@/components/ui/sidebar/sidebar-context";
import { useNotifications } from "@/hooks/useNotifications";
import { MinerCountIndicator, MiningStatusIndicatorFull } from "@/components/MinerCountIndicator";

export function AppSidebar() {
  const location = useLocation();
  const { resetData } = useMining();
  const { clearAll } = useNotifications();
  const { setOpenMobile, setOpen, isMobile } = useSidebar();

  const resetAllData = () => {
    clearAll();
    resetData();
    handleItemClick();
  };

  const handleItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

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
                    onClick={handleItemClick}
                  >
                    <TypedLink routeKeyName={route.keyName}>
                      <route.icon className="h-4 w-4 mr-3" />
                      <span className="font-medium">{route.sidebarTitle}</span>
                      {route.keyName === 'notifications' && (
                        <NotificationBadge maybeClassName="ml-auto" maybeShowIcon={false} />
                      )}
                    </TypedLink>
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
                  onClick={() => {
                    resetAllData();
                  }}
                  className="px-3 py-2 w-full transition-colors duration-200 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  <span className="font-medium">Clear Data</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="px-6 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold mb-2">
            Status
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="px-3">
                <SidebarMenuButton
                  className="px-3 py-2 w-full transition-colors duration-200"
                >
                  <MiningStatusIndicatorFull  />
                  {/* <span className="font-medium">Mining</span> */}
                </SidebarMenuButton>
                <SidebarMenuButton
                  className="px-3 py-2 w-full transition-colors duration-200"
                >
                  <MinerCountIndicator />
                  {/* <span className="font-medium">Miners</span> */}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}