import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import NewProject from "./pages/NewProject";
import ProjectList from "./pages/ProjectList";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectManagement from "./pages/ProjectManagement";
import TeamMembers from "./pages/TeamMembers";
import Products from "./pages/Products";
import Implantacao from "./pages/Implantacao";
import AcervoTecnico from "./pages/AcervoTecnico";

import UserManagement from "./pages/UserManagement";
import PermissionsAdmin from "./pages/PermissionsAdmin";
import SystemSettings from "./pages/SystemSettings";
import SystemManual from "./pages/SystemManual";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projetos" element={<Projects />} />
              <Route path="/projetos/novo" element={<AdminRoute><NewProject /></AdminRoute>} />
              <Route path="/projetos/lista" element={<ProjectList />} />
              
              <Route path="/projetos/gestao" element={<ProjectManagement />} />
              <Route path="/projetos/:id" element={<ProjectDetail />} />
              <Route path="/implantacao" element={<Implantacao />} />
              <Route path="/acervo" element={<AcervoTecnico />} />
              <Route path="/admin/equipe" element={<AdminRoute><TeamMembers /></AdminRoute>} />
              <Route path="/admin/produtos" element={<AdminRoute><Products /></AdminRoute>} />
              <Route path="/admin/usuarios" element={<AdminRoute><UserManagement /></AdminRoute>} />
              <Route path="/admin/configuracoes" element={<AdminRoute><SystemSettings /></AdminRoute>} />
              <Route path="/manual" element={<SystemManual />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
