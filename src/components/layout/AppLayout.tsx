import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { ShareControls } from "@/components/mining/ShareControls";
import { AnimatePresence } from "framer-motion";
import { getPageTitle, routes } from "@/routes";
import { useMining } from "@/contexts/MiningContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MinerCountIndicator,
  MiningStatusIndicator,
} from "@/components/MinerCountIndicator";
import { AppFooter } from "./AppFooter";
import { AppScrollManager } from "./AppScrollManager";
import { SourceCodeLink } from "@/components/SourceCodeLink";

export function AppLayout() {
  const location = useLocation();
  const { isMining } = useMining();
  const isMobile = useIsMobile();

  const shouldShowShareControls =
    location.pathname === "/" ||
    (isMobile && location.pathname === routes.simpleMining.path);

  return (
    <SidebarProvider defaultOpen={false}>
      <AppScrollManager />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex min-h-screen flex-1 flex-col">
          <div className="sticky top-0 z-[150] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-6 relative">
            {isMining && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(-45deg,theme(colors.green.500),theme(colors.green.500)_10px,theme(colors.green.900)_10px,theme(colors.green.900)_20px)] bg-[length:28.4px_100%] animate-stripes"></div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3 md:gap-4">
                <SidebarTrigger className="h-8 w-8" />
                <h1 className="min-w-0 truncate text-2xl font-bold md:text-4xl">
                  {getPageTitle(location.pathname)}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2 md:gap-4">
                <div className="hidden items-center gap-2 md:flex">
                  <MiningStatusIndicator />
                  <MinerCountIndicator />
                </div>
                {shouldShowShareControls && <ShareControls />}
                <SourceCodeLink
                  mode="icon"
                  buttonVariant="outline"
                  className="h-9 w-9 border-border/70 bg-background/60"
                />
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
