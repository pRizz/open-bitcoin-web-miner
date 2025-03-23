import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { MiningProvider } from "@/contexts/MiningContext";
import { ShareProvider } from "@/contexts/ShareContext";
import { DebugProvider } from "@/contexts/DebugContext";
import { NetworkInfoProvider } from "@/contexts/NetworkInfoContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "@/pages/Index";
import Leaderboard from "@/pages/Leaderboard";
import SubmissionPage from "@/pages/submission/[hash]";
import About from "@/pages/About";
import { MiningWebSocketProvider } from "./contexts/mining/useMiningWebSocket";
import { MinerInfoProvider } from "./contexts/mining/MinerInfoContext";
import { LeaderboardProvider } from "./contexts/leaderboard/LeaderboardContext";
import { GlobalLeaderboardProvider } from "./contexts/GlobalLeaderboardContext";
import { MiningEventsProvider } from "@/contexts/mining/MiningEventsContext";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "leaderboard",
        element: <Leaderboard />,
      },
      {
        path: "submission/:hash",
        element: <SubmissionPage />,
      },
      {
        path: "about",
        element: <About />,
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
              <ShareProvider>
                <MiningWebSocketProvider>
                  <MiningEventsProvider>
                    <MiningProvider>
                      <LeaderboardProvider>
                        <RouterProvider router={router} />
                        <Toaster />
                      </LeaderboardProvider>
                    </MiningProvider>
                  </MiningEventsProvider>
                </MiningWebSocketProvider>
              </ShareProvider>
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