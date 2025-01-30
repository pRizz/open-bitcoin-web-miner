import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { ShareControls } from "@/components/mining/ShareControls";
import { useMining } from "@/contexts/MiningContext";

export function AppLayout() {
  const location = useLocation();
  const { btcAddress } = useMining();

  const getPageTitle = () => {
    return location.pathname === "/" ? "Personal Mining" : "Global Leaderboard";
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8" />
              <h1 className="text-4xl font-bold">{getPageTitle()}</h1>
            </div>
            {location.pathname === "/" && (
              <ShareControls
                includeAutoStart={false}
                includeAddress={false}
                btcAddress={btcAddress}
              />
            )}
          </div>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}