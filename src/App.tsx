import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { MiningProvider } from "@/contexts/MiningContext";
import { ShareProvider } from "@/contexts/ShareContext";
import { DebugProvider } from "@/contexts/DebugContext";
import { GRPCProvider } from "@/contexts/GRPCContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "@/pages/Index";
import Leaderboard from "@/pages/Leaderboard";

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
        <GRPCProvider>
          <MiningProvider>
            <ShareProvider>
              <RouterProvider router={router} />
              <Toaster />
            </ShareProvider>
          </MiningProvider>
        </GRPCProvider>
      </DebugProvider>
    </QueryClientProvider>
  );
}

export default App;