import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ShareControls } from "@/components/mining/ShareControls";
import { useShare } from "@/contexts/ShareContext";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { getPageTitle } from "@/routes";
import { useMining } from "@/contexts/MiningContext";
import { TypedLink } from "@/components/TypedLink";
import { useIsMobile } from "@/hooks/use-mobile";
import { routes } from "@/routes";
import { useEffect } from "react";

// Session-only variable to track if user has visited home page in this session
let hasVisitedHomeThisSession = false;

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

function MiningStatusIndicator() {
  const { isMining } = useMining();

  if (!isMining) return null;

  return (
    <TypedLink routeKeyName="home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="text-sm text-gray-300">Mining</span>
    </TypedLink>
  );
}

export function AppLayout() {
  const location = useLocation();
  const { isMining } = useMining();
  const isMobile = useIsMobile();

  // // Mobile redirect logic with session-only user intent detection
  // useEffect(() => {
  //   // Use synchronous mobile detection to avoid timing issues
  //   const isMobileSyncResult = isMobileSync();
    
  //   // Only redirect if on mobile and we're on the homepage
  //   if (!hasVisitedHomeThisSession && isMobileSyncResult && location.pathname === routes.home.path) {
  //     // Check if user explicitly navigated to homepage
  //     const maybeReferrer = document.referrer;
  //     const hasUrlParams = searchParams.toString().length > 0;
      
  //     // Consider it explicit navigation if:
  //     // 1. Has URL parameters (auto-start, bitcoin address, etc.)
  //     // 2. User has visited the home page in this session (shows intent)
  //     // 3. Has any referrer (means they came from somewhere)
  //     const isExplicitNavigation = hasUrlParams || hasVisitedHomeThisSession || maybeReferrer;
      
  //     // If not an explicit navigation, redirect to simple mining
  //     if (!isExplicitNavigation) {
  //       navigate(routes.simpleMining.path, { replace: true });
  //     } else {
  //       // Mark that user has visited home page in this session
  //       hasVisitedHomeThisSession = true;
  //     }
  //   }
  // }, [location.pathname, navigate, searchParams]);

  // Show ShareControls on home page or simple mining page for mobile users
  const shouldShowShareControls = location.pathname === "/" || 
    (isMobile && location.pathname === routes.simpleMining.path);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
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