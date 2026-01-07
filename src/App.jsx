import { Toaster } from "./components/ui/sonner.jsx";
import { TooltipProvider } from "./components/ui/tooltip.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import PostAd from "./pages/PostAd.jsx";
import AdDetail from "./pages/AdDetail.jsx";
import MyAds from "./pages/MyAds.jsx";
import Profile from "./pages/Profile.jsx";
import Messages from "./pages/Messages.jsx";
import NotFound from "./pages/NotFound.jsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/post-ad" element={<PostAd />} />
            <Route path="/ad/:id" element={<AdDetail />} />
            <Route path="/my-ads" element={<MyAds />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
