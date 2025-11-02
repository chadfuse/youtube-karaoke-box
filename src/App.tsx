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
            // Remove any previously injected custom head nodes
            document.querySelectorAll('[data-custom-head="true"]').forEach(n => n.remove());

            // Parse provided markup and inject elements properly so scripts execute
            const wrapper = document.createElement('div');
            wrapper.innerHTML = scriptContent;

            Array.from(wrapper.childNodes).forEach(node => {
              if (node.nodeType !== Node.ELEMENT_NODE) return;
              const el = node as HTMLElement;
              const tag = el.tagName.toLowerCase();

              if (tag === 'script') {
                const scriptEl = document.createElement('script');
                Array.from(el.attributes).forEach(attr => scriptEl.setAttribute(attr.name, attr.value));
                scriptEl.setAttribute('data-custom-head', 'true');
                if (!scriptEl.getAttribute('src') && el.textContent) {
                  scriptEl.text = el.textContent;
                }
                document.head.appendChild(scriptEl);
              } else if (tag === 'link') {
                const linkEl = document.createElement('link');
                Array.from(el.attributes).forEach(attr => linkEl.setAttribute(attr.name, attr.value));
                linkEl.setAttribute('data-custom-head', 'true');
                document.head.appendChild(linkEl);
              } else if (tag === 'meta') {
                const metaEl = document.createElement('meta');
                Array.from(el.attributes).forEach(attr => metaEl.setAttribute(attr.name, attr.value));
                metaEl.setAttribute('data-custom-head', 'true');
                document.head.appendChild(metaEl);
              } else if (tag === 'style') {
                const styleEl = document.createElement('style');
                styleEl.setAttribute('data-custom-head', 'true');
                styleEl.textContent = el.textContent || '';
                document.head.appendChild(styleEl);
              } else if (tag === 'noscript') {
                const nosEl = document.createElement('noscript');
                nosEl.setAttribute('data-custom-head', 'true');
                nosEl.innerHTML = el.innerHTML;
                document.body.appendChild(nosEl);
              }
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
