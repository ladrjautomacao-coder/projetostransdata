import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import NewProject from "./pages/NewProject";
import ProjectList from "./pages/ProjectList";
import ProjectDetail from "./pages/ProjectDetail";
import TeamMembers from "./pages/TeamMembers";
import Products from "./pages/Products";
import Implantacao from "./pages/Implantacao";
import AcervoTecnico from "./pages/AcervoTecnico";
import ProjectAnalytics from "./pages/ProjectAnalytics";
import UserManagement from "./pages/UserManagement";
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
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projetos" element={<Projects />} />
              <Route path="/projetos/novo" element={<NewProject />} />
              <Route path="/projetos/lista" element={<ProjectList />} />
              <Route path="/projetos/analitico" element={<ProjectAnalytics />} />
              <Route path="/projetos/:id" element={<ProjectDetail />} />
              <Route path="/implantacao" element={<Implantacao />} />
              <Route path="/acervo" element={<AcervoTecnico />} />
              <Route path="/admin/equipe" element={<TeamMembers />} />
              <Route path="/admin/produtos" element={<Products />} />
              <Route path="/admin/usuarios" element={<UserManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
