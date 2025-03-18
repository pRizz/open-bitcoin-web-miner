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
import { MiningWebSocketProvider } from "./contexts/mining/useMiningWebSocket";
import { MinerInfoProvider } from "./contexts/mining/MinerInfoContext";
import { LeaderboardProvider } from "./contexts/leaderboard/LeaderboardContext";
import { GlobalLeaderboardProvider } from "./contexts/GlobalLeaderboardContext";

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
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DebugProvider>
        <NetworkInfoProvider>
          <MinerInfoProvider>
            <MiningWebSocketProvider>
              <MiningProvider>
                <ShareProvider>
                  <LeaderboardProvider>
                    <GlobalLeaderboardProvider>
                      <RouterProvider router={router} />
                      <Toaster />
                    </GlobalLeaderboardProvider>
                  </LeaderboardProvider>
                </ShareProvider>
              </MiningProvider>
            </MiningWebSocketProvider>
          </MinerInfoProvider>
        </NetworkInfoProvider>
      </DebugProvider>
    </QueryClientProvider>
  );
}

export default App;