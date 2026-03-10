import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import UserDashboard from "@/pages/UserDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import TimeEntry from "@/pages/TimeEntry";
import History from "@/pages/History";
import Justifications from "@/pages/Justifications";
import Notifications from "@/pages/Notifications";
import AdminUsers from "@/pages/AdminUsers";
import AdminReports from "@/pages/AdminReports";
import AdminSettings from "@/pages/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
}

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'user' | 'admin' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/registrar-ponto" element={<ProtectedRoute role="user"><TimeEntry /></ProtectedRoute>} />
              <Route path="/historico" element={<ProtectedRoute role="user"><History /></ProtectedRoute>} />
              <Route path="/justificativas" element={<ProtectedRoute role="user"><Justifications /></ProtectedRoute>} />
              <Route path="/notificacoes" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/admin/usuarios" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/relatorios" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />
              <Route path="/admin/configuracoes" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
