import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "./i18n/LanguageContext";
import ChatView from "./pages/ChatView";
import NotFound from "./pages/NotFound";
import ArtificialStressSimulator from "./pages/ArtificialStressSimulator";
import Ehrenerklaerung from "./pages/Ehrenerklaerung";
import CyberCrisisSimulator from "./pages/CyberCrisisSimulator";
import DoraIncidentReporter from "./pages/DoraIncidentReporter";
import PciDssSaqNavigator from "./pages/PciDssSaqNavigator";
import IspcTtxPrioritizer from "./pages/IspcTtxPrioritizer";
import Nis2AwarenessQuiz from "./pages/Nis2AwarenessQuiz";
import CisoSimulator from "./pages/CisoSimulator";
import ThreatDropQuiz from "./pages/ThreatDropQuiz";

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
              <Route path="/matrix" element={<ArtificialStressSimulator />} />
              <Route path="/ehrenerklaerung" element={<Ehrenerklaerung />} />
              <Route path="/crisis" element={<CyberCrisisSimulator />} />
              <Route path="/ki-workflows" element={<DoraIncidentReporter />} />
              <Route path="/pci-check" element={<PciDssSaqNavigator />} />
              <Route path="/ttx-prioritizer" element={<IspcTtxPrioritizer />} />
              <Route path="/nis2-quiz" element={<Nis2AwarenessQuiz />} />
              <Route path="/ciso-sim" element={<CisoSimulator />} />
              <Route path="/threatdrop" element={<ThreatDropQuiz />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
