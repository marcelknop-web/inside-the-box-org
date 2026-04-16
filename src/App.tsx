import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ChatView from "./pages/ChatView";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";

const EliteShipScene = lazy(() => import("./pages/EliteShipScene"));
const TtxAdmin = lazy(() => import("./pages/TtxAdmin"));
const ItsmTool = lazy(() => import("./pages/ItsmTool"));
const ItsmDevTool = lazy(() => import("./pages/ItsmDevTool"));
const SocLife = lazy(() => import("./pages/SocLife"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ChatView />} />
              <Route path="/nis2-compliance" element={<ChatView />} />
              <Route path="/iacs-e27" element={<ChatView />} />
              <Route path="/iec62443" element={<ChatView />} />
              <Route path="/berlin-drift" element={<Suspense fallback={null}><EliteShipScene /></Suspense>} />
              <Route path="/ttx-admin" element={<Suspense fallback={null}><TtxAdmin /></Suspense>} />
              <Route path="/itsm" element={<Suspense fallback={null}><ItsmTool /></Suspense>} />
              <Route path="/itsm-dev" element={<Suspense fallback={null}><ItsmDevTool /></Suspense>} />
              <Route path="/soc-life" element={<Suspense fallback={null}><SocLife /></Suspense>} />
              <Route path="/:serviceId" element={<ChatView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
