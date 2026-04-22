import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { RouteSkeleton } from "@/components/RouteSkeleton";
import { ScrollToTopFab } from "@/components/ScrollToTopFab";
import ChatView from "./pages/ChatView";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";

// Active routes only. Archived (no longer in Routes, files retained for reference):
//   /legacy, /overview, /berlin-drift, /enigma, /soc-life, /nis2-compliance,
//   /iacs-e27, /iec62443 — all reachable via the unified /:serviceId catchall
//   in ChatView, or removed from the Journey navigation entirely.
const TtxAdmin = lazy(() => import("./pages/TtxAdmin"));
const ItsmTool = lazy(() => import("./pages/ItsmTool"));
const ItsmDevTool = lazy(() => import("./pages/ItsmDevTool"));
const TtxReadinessPage = lazy(() => import("./pages/TtxReadinessPage"));
const Overview = lazy(() => import("./pages/Overview"));
const Imprint = lazy(() => import("./pages/Imprint"));

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
              {/* Active Journey + entry points */}
              <Route path="/" element={<Suspense fallback={<RouteSkeleton />}><Overview /></Suspense>} />
              <Route path="/impressum" element={<Suspense fallback={<RouteSkeleton />}><Imprint /></Suspense>} />
              <Route path="/imprint" element={<Suspense fallback={<RouteSkeleton />}><Imprint /></Suspense>} />

              {/* Standalone tools (not part of the Journey, kept for direct/admin access) */}
              <Route path="/ttx-admin" element={<Suspense fallback={<RouteSkeleton />}><TtxAdmin /></Suspense>} />
              <Route path="/itsm" element={<Suspense fallback={<RouteSkeleton />}><ItsmTool /></Suspense>} />
              <Route path="/itsm-dev" element={<Suspense fallback={<RouteSkeleton />}><ItsmDevTool /></Suspense>} />
              <Route path="/ttx-readiness" element={<Suspense fallback={<RouteSkeleton />}><TtxReadinessPage /></Suspense>} />

              {/* Catch-all: every Journey service id (nis2-dora, virtual-ciso, …) renders ChatView */}
              <Route path="/:serviceId" element={<ChatView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ScrollToTopFab />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
