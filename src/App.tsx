import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MiningProvider } from "@/contexts/MiningContext";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MiningProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </MiningProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;