import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
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
import { MiningWebSocketProvider } from "./contexts/mining/useMiningWebSocket";
import { MinerInfoProvider } from "./contexts/mining/MinerInfoContext";
import { GlobalLeaderboardProvider } from "./contexts/GlobalLeaderboardContext";
import { MiningEventsProvider } from "@/contexts/mining/MiningEventsContext";
import { routes } from "./routes";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: routes.home.routerPath,
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Index />,
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
    ],
  },
]);

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