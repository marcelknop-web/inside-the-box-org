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
import Overview from "./pages/Overview";
import { lazy, Suspense } from "react";

// Active routes only. Standalone tools and the unified /:serviceId catchall
// (handled by ChatView) cover everything else. Older archived routes
// (/legacy, /berlin-drift, /imprint, …) have been removed entirely.
// Overview is eager-loaded: it is the landing route, so lazy-loading it just
// adds a critical request to the network dependency chain (HTML → JS → chunk)
// without any UX benefit.
const TtxAdmin = lazy(() => import("./pages/TtxAdmin"));
const ItsmTool = lazy(() => import("./pages/ItsmTool"));
const ItsmDevTool = lazy(() => import("./pages/ItsmDevTool"));
const TtxReadinessPage = lazy(() => import("./pages/TtxReadinessPage"));
// Imprint route removed — the imprint is now exclusively shown via the
// SiteChrome drawer (footer "Impressum" link opens the overlay).
const Enigma = lazy(() => import("./pages/Enigma"));
const BaerbockBot = lazy(() => import("./pages/BaerbockBot"));
const SksNavigationQuiz = lazy(() => import("./pages/SksNavigationQuiz"));
const Nordstern = lazy(() => import("./pages/Nordstern"));
const Sitemap = lazy(() => import("./pages/Sitemap"));

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
              <Route path="/" element={<Overview />} />
              {/* Imprint is now drawer-only — see SiteChrome footer link. */}

              {/* Standalone tools (not part of the Journey, kept for direct/admin access) */}
              <Route path="/ttx-admin" element={<Suspense fallback={<RouteSkeleton />}><TtxAdmin /></Suspense>} />
              <Route path="/itsm" element={<Suspense fallback={<RouteSkeleton />}><ItsmTool /></Suspense>} />
              <Route path="/itsm-dev" element={<Suspense fallback={<RouteSkeleton />}><ItsmDevTool /></Suspense>} />
              <Route path="/ttx-readiness" element={<Suspense fallback={<RouteSkeleton />}><TtxReadinessPage /></Suspense>} />
              <Route path="/enigma" element={<Suspense fallback={<RouteSkeleton />}><Enigma /></Suspense>} />
              <Route path="/bockbaer-bot" element={<Suspense fallback={<RouteSkeleton />}><BaerbockBot /></Suspense>} />
              <Route path="/sks-quiz" element={<Suspense fallback={<RouteSkeleton />}><SksNavigationQuiz /></Suspense>} />
              <Route path="/nordstern" element={<Suspense fallback={<RouteSkeleton />}><Nordstern /></Suspense>} />
              <Route path="/sitemap" element={<Suspense fallback={<RouteSkeleton />}><Sitemap /></Suspense>} />

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
