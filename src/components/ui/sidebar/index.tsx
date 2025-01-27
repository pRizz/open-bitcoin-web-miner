import { cn } from "@/lib/utils"
export { Sidebar } from "./sidebar"
export { SidebarProvider, useSidebar } from "./sidebar-context"
export { SidebarTrigger } from "./components/trigger"
export { SidebarRail } from "./components/rail"
export {
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "./components/structural"
export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./components/menu"

// Re-export the cn utility since it's commonly used with the sidebar
export { cn }