
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import AboutPage from "./pages/AboutPage";
import VenturesPage from "./pages/VenturesPage";
import SpeakingPage from "./pages/SpeakingPage";
import AnimationsPage from "./pages/AnimationsPage";
import LearningPage from "./pages/LearningPage";
import EventsPage from "./pages/EventsPage";
import ConsultPage from "./pages/ConsultPage";
import AuthPage from "./pages/AuthPage"; // New AuthPage
import { AuthProvider } from "./contexts/AuthContext";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/ventures" element={<VenturesPage />} />
            <Route path="/speaking" element={<SpeakingPage />} />
            <Route path="/ai-animations" element={<AnimationsPage />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/consult" element={<ConsultPage />} />
            <Route path="/auth" element={<AuthPage />} /> {/* New AuthPage route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
