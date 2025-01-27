import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { MiningProvider } from "@/contexts/MiningContext";
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
      <MiningProvider>
        <RouterProvider router={router} />
        <Toaster />
      </MiningProvider>
    </QueryClientProvider>
  );
}

export default App;