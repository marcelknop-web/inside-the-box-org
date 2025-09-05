import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Start from "./pages/Start";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/why" element={<Index />} />
          <Route path="/training" element={<Training />} />
          <Route path="/by-whom" element={<ByWhom />} />
          
          <Route path="/contact" element={<Contact />} />
          <Route path="/technical-requirements" element={<TechnicalRequirements />} />
          <Route path="/consulting" element={<Consulting />} />
          <Route path="/consulting/team" element={<ConsultingTeam />} />
          <Route path="/imprint" element={<Imprint />} />
          <Route path="/isms" element={<ISMS />} />
          <Route path="/nis2-dora" element={<NIS2DORA />} />
          <Route path="/tisax-pci-dss" element={<TISAXPCIDSS />} />
          <Route path="/assessments-concepts" element={<AssessmentsConcepts />} />
          <Route path="/incident-management" element={<IncidentManagement />} />
          <Route path="/cyber-crisis-management" element={<CyberCrisisManagement />} />
          <Route path="/arena-training" element={<ArenaTraining />} />
          <Route path="/events-workshops" element={<EventsWorkshops />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/virtual-ciso" element={<VirtualCISO />} />
          <Route path="/design-system" element={<DesignSystem />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
