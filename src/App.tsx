import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "./i18n/LanguageContext";
import Start from "./pages/Start";
import ChatView from "./pages/ChatView";
import Index from "./pages/Index";
import Training from "./pages/Training";
import ByWhom from "./pages/ByWhom";
import Contact from "./pages/Contact";
import TechnicalRequirements from "./pages/TechnicalRequirements";
import Consulting from "./pages/Consulting";
import ConsultingTeam from "./pages/ConsultingTeam";

import Imprint from "./pages/Imprint";
import ISMS from "./pages/ISMS";
import NIS2DORA from "./pages/NIS2DORA";
import TISAXPCIDSS from "./pages/TISAXPCIDSS";
import AssessmentsConcepts from "./pages/AssessmentsConcepts";
import IncidentManagement from "./pages/IncidentManagement";
import CyberCrisisManagement from "./pages/CyberCrisisManagement";
import ArenaTraining from "./pages/ArenaTraining";
import EventsWorkshops from "./pages/EventsWorkshops";
import Publications from "./pages/Publications";
import VirtualCISO from "./pages/VirtualCISO";
import DesignSystem from "./pages/DesignSystem";
import ComponentLibrary from "./pages/ComponentLibrary";
import ColorPalette from "./pages/ColorPalette";
import TemplateGallery from "./pages/TemplateGallery";
import DesignTokens from "./pages/DesignTokens";
import DesignHome from "./pages/DesignHome";
import NotFound from "./pages/NotFound";

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
              {/* Legacy/archive routes */}
              <Route path="/legacy" element={<Start />} />
              <Route path="/legacy/design" element={<DesignHome />} />
              <Route path="/legacy/why" element={<Index />} />
              <Route path="/legacy/training" element={<Training />} />
              <Route path="/legacy/by-whom" element={<ByWhom />} />
              <Route path="/legacy/contact" element={<Contact />} />
              <Route path="/legacy/technical-requirements" element={<TechnicalRequirements />} />
              <Route path="/legacy/consulting" element={<Consulting />} />
              <Route path="/legacy/consulting/team" element={<ConsultingTeam />} />
              <Route path="/legacy/imprint" element={<Imprint />} />
              <Route path="/legacy/isms" element={<ISMS />} />
              <Route path="/legacy/nis2-dora" element={<NIS2DORA />} />
              <Route path="/legacy/tisax-pci-dss" element={<TISAXPCIDSS />} />
              <Route path="/legacy/assessments-concepts" element={<AssessmentsConcepts />} />
              <Route path="/legacy/incident-management" element={<IncidentManagement />} />
              <Route path="/legacy/cyber-crisis-management" element={<CyberCrisisManagement />} />
              <Route path="/legacy/arena-training" element={<ArenaTraining />} />
              <Route path="/legacy/events-workshops" element={<EventsWorkshops />} />
              <Route path="/legacy/publications" element={<Publications />} />
              <Route path="/legacy/virtual-ciso" element={<VirtualCISO />} />
              <Route path="/legacy/design-system" element={<DesignSystem />} />
              <Route path="/legacy/components" element={<ComponentLibrary />} />
              <Route path="/legacy/colors" element={<ColorPalette />} />
              <Route path="/legacy/templates" element={<TemplateGallery />} />
              <Route path="/legacy/tokens" element={<DesignTokens />} />
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
