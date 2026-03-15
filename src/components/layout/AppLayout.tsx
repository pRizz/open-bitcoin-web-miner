import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { ShareControls } from "@/components/mining/ShareControls";
import { AnimatePresence } from "framer-motion";
import { getPageTitle, routes } from "@/routes";
import { useMining } from "@/contexts/MiningContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MinerCountIndicator, MiningStatusIndicator } from "@/components/MinerCountIndicator";
import { AppFooter } from "./AppFooter";

export function AppLayout() {
  const location = useLocation();
  const { isMining } = useMining();
  const isMobile = useIsMobile();

  const shouldShowShareControls = location.pathname === "/"
    || (isMobile && location.pathname === routes.simpleMining.path);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex min-h-screen flex-1 flex-col">
          <div className="sticky top-0 z-[150] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-6 relative">
            {isMining && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(-45deg,theme(colors.green.500),theme(colors.green.500)_10px,theme(colors.green.900)_10px,theme(colors.green.900)_20px)] bg-[length:28.4px_100%] animate-stripes">
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-8 w-8" />
                <h1 className="text-4xl font-bold">{getPageTitle(location.pathname)}</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 md:block hidden">
                  <MiningStatusIndicator />
                  <MinerCountIndicator />
                </div>
                {shouldShowShareControls && (
                  <ShareControls />
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 p-6">
            <AnimatePresence mode="wait">
              <Outlet />
            </AnimatePresence>
          </div>
          <AppFooter />
        </main>
      </div>
    </SidebarProvider>
  );
}
