import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { MuleProvider } from "@/context/MuleContext";
import { Navbar } from "@/components/Navbar";
import { AnimatePresence } from "framer-motion";

import Index from "./pages/Index";
import Patterns from "./pages/Patterns";
import TransactionsPage from "./pages/TransactionsPage";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/patterns" element={<Patterns />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MuleProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1">
              <AnimatedRoutes />
            </main>
            <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-muted/20">
              <p>MuleGuard Sentinel · RIFT 2026 Hackathon</p>
              <p className="mt-1 opacity-70">Graph Theory / Financial Crime Detection Track</p>
            </footer>
          </div>
        </BrowserRouter>
      </MuleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
