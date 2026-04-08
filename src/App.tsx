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

const Nis2ComplianceTool = lazy(() => import("./pages/Nis2ComplianceTool"));
const Iec62443ComplianceTool = lazy(() => import("./pages/Iec62443ComplianceTool"));

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
              <Route path="/nis2-compliance" element={<Suspense fallback={null}><Nis2ComplianceTool /></Suspense>} />
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
