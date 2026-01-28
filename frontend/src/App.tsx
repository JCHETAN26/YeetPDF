import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import UploadSuccess from "./pages/UploadSuccess";
import PublicViewer from "./pages/PublicViewer";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import About from "./pages/About";
import Contact from "./pages/Contact";

const queryClient = new QueryClient();

// Google OAuth Client ID - set this in your .env file
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/success" element={<UploadSuccess />} />
              {/* User dashboard - shows all their documents */}
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Public viewer - clean PDF-only view for link recipients */}
              <Route path="/v/:documentId" element={<PublicViewer />} />
              {/* Analytics dashboard - for uploaders only */}
              <Route path="/analytics/:documentId" element={<AnalyticsDashboard />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              {/* Legal & Info Pages */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);

export default App;
