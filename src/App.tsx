import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AlumnosPage from "./pages/Alumnos";
import InstructoresPage from "./pages/Instructores";
import CaballosPage from "./pages/Caballos";
import ClasesPage from "./pages/Clases";
import CalendarioPage from "./pages/Calendario";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/alumnos" element={<AlumnosPage />} />
          <Route path="/instructores" element={<InstructoresPage />} />
          <Route path="/caballos" element={<CaballosPage />} />
          <Route path="/clases" element={<ClasesPage />} />
          <Route path="/calendario" element={<CalendarioPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
