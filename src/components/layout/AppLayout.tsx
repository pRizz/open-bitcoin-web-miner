import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { ShareControls } from "@/components/mining/ShareControls";
import { useShare } from "@/contexts/ShareContext";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { getPageTitle } from "@/types/pages";

function MinerCountIndicator() {
  const { maybeConnectedMinerCount } = useNetworkInfo();
  const isConnected = maybeConnectedMinerCount !== undefined;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-green-500" : "bg-gray-400"
        )}
      />
      <span className="text-sm text-gray-300">
        {isConnected
          ? `${maybeConnectedMinerCount} ${maybeConnectedMinerCount === 1 ? 'miner' : 'miners'} connected`
          : 'Connecting...'
        }
      </span>
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  const { includeAutoStart, includeAddress } = useShare();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <div className="sticky top-0 z-[150] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-8 w-8" />
                <h1 className="text-4xl font-bold">{getPageTitle(location.pathname)}</h1>
              </div>
              <div className="flex items-center gap-4">
                <MinerCountIndicator />
                {location.pathname === "/" && (
                  <ShareControls
                    includeAutoStart={includeAutoStart}
                    includeAddress={includeAddress}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            <AnimatePresence mode="wait">
              <Outlet />
            </AnimatePresence>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}