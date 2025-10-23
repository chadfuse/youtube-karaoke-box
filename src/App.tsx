import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { KaraokeProvider } from "@/state/karaokeStore";
import { supabase } from "@/integrations/supabase/client";
import { validateHeaderScript } from "@/utils/headerScriptValidation";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const loadHeaderScript = async () => {
      try {
        const { data, error } = await supabase
          .from('global_settings')
          .select('value')
          .eq('key', 'header_script')
          .single();

        if (!error && data?.value) {
          const scriptContent = (data.value as any).value || '';
          if (scriptContent && validateHeaderScript(scriptContent)) {
            // Remove existing custom head script if any
            const existingScript = document.getElementById('custom-head-script');
            if (existingScript) {
              existingScript.remove();
            }

            // Create a container div for the custom scripts
            const container = document.createElement('div');
            container.id = 'custom-head-script';
            container.innerHTML = scriptContent;

            // Append all child nodes to head
            Array.from(container.childNodes).forEach(node => {
              document.head.appendChild(node.cloneNode(true));
            });
          } else if (scriptContent) {
            console.warn('Header script blocked: failed validation');
          }
        }
      } catch (error) {
        console.error('Error loading header script:', error);
      }
    };

    loadHeaderScript();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <KaraokeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </KaraokeProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
