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
import About from "./pages/About";
import Imprint from "./pages/Imprint";
import ISMS from "./pages/ISMS";
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
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/technical-requirements" element={<TechnicalRequirements />} />
          <Route path="/consulting" element={<Consulting />} />
          <Route path="/consulting/team" element={<ConsultingTeam />} />
          <Route path="/imprint" element={<Imprint />} />
          <Route path="/isms" element={<ISMS />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
