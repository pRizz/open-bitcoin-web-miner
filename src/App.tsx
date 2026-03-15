import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, redirect, RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { MiningProvider } from "@/contexts/MiningContext";
import { ShareProvider } from "@/contexts/ShareContext";
import { DebugProvider } from "@/contexts/DebugContext";
import { NetworkInfoProvider } from "@/contexts/NetworkInfoContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "@/pages/Index";
import SimpleMining from "@/pages/SimpleMining";
import Leaderboard from "@/pages/Leaderboard";
import Notifications from "@/pages/Notifications";
import SubmissionPage from "@/pages/submission/[hash]";
import About from "@/pages/About";
import ProofOfRewardPage from "@/pages/ProofOfReward";
import MiningStatisticsPage from "@/pages/MiningStatistics";
import HomeBitcoinMiningPage from "@/pages/HomeBitcoinMining";
import { MiningWebSocketProvider } from "./contexts/mining/useMiningWebSocket";
import { MinerInfoProvider } from "./contexts/mining/MinerInfoContext";
import { GlobalLeaderboardProvider } from "./contexts/GlobalLeaderboardContext";
import { MiningEventsProvider } from "@/contexts/mining/MiningEventsContext";
import { routes } from "./routes";
import { isMobileSync } from "@/hooks/use-mobile";
import HashDetailsPage from "@/pages/hashDetails/[hash]";

const queryClient = new QueryClient();
// Session-only variable to track if user has visited home page in this session
let hasVisitedWebsiteThisSession = false;

function isFromSameOrigin(referrer: string | undefined): boolean {
  return referrer && new URL(referrer).origin === window.location.origin;
}

const isFromRefresh = () => {
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return navEntry?.type === 'reload';
}

const router = createBrowserRouter([
  {
    path: routes.home.routerPath,
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Index />,
        loader: () => {
          // Check if user came from a refresh or another page
          const maybeReferrer = document.referrer;
          const isFromSameOriginValue = isFromSameOrigin(maybeReferrer);
          const isFromRefreshValue = isFromRefresh();
          console.log("maybeReferrer", maybeReferrer);
          console.log("isFromSameOrigin", isFromSameOriginValue);
          console.log("isFromRefresh", isFromRefreshValue);
          console.log("hasVisitedHomeThisSession", hasVisitedWebsiteThisSession);

          if (!hasVisitedWebsiteThisSession && isMobileSync() && !isFromSameOriginValue && !isFromRefreshValue) {
            console.log("Redirecting to simple mining");
            return redirect(routes.simpleMining.path);
          } else {
            console.log("Not redirecting to simple mining");
          }
          return null;
        },
      },
      {
        path: routes.simpleMining.routerPath,
        element: <SimpleMining />,
      },
      {
        path: routes.leaderboard.routerPath,
        element: <Leaderboard />,
      },
      {
        path: routes.notifications.routerPath,
        element: <Notifications />,
      },
      {
        path: routes.submission.routerPath,
        element: <SubmissionPage />,
      },
      {
        path: routes.hashDetails.routerPath,
        element: <HashDetailsPage />,
      },
      {
        path: routes.about.routerPath,
        element: <About />,
      },
      {
        path: routes.proofOfReward.routerPath,
        element: <ProofOfRewardPage />,
      },
      {
        path: routes.miningStatistics.routerPath,
        element: <MiningStatisticsPage />,
      },
      {
        path: routes.homeBitcoinMining.routerPath,
        element: <HomeBitcoinMiningPage />,
      },
    ],
  },
]);

hasVisitedWebsiteThisSession = true;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DebugProvider>
        <NetworkInfoProvider>
          <MinerInfoProvider>
            <GlobalLeaderboardProvider>
              <MiningWebSocketProvider>
                <MiningEventsProvider>
                  <MiningProvider>
                    <ShareProvider>
                      <RouterProvider router={router} />
                      <Toaster />
                    </ShareProvider>
                  </MiningProvider>
                </MiningEventsProvider>
              </MiningWebSocketProvider>
            </GlobalLeaderboardProvider>
          </MinerInfoProvider>
        </NetworkInfoProvider>
      </DebugProvider>
    </QueryClientProvider>
  );
}

console.log(`Version ${import.meta.env.PACKAGE_VERSION}`);
console.log(`Build Time: ${import.meta.env.BUILD_TIME}`);

export default App;
