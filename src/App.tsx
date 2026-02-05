import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { useState, useEffect, ReactNode } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentMensalidades from "./pages/StudentMensalidades";
import StudentAulas from "./pages/StudentAulas";
import StudentNotifications from "./pages/StudentNotifications";
import Students from "./pages/Students";
import Reports from "./pages/Reports";
import Cities from "./pages/Cities";
import Mensalidades from "./pages/Mensalidades";
import ExameFaixas from "./pages/ExameFaixas";
import Horarios from "./pages/Horarios";
import Frequencia from "./pages/Frequencia";
import ContaBloqueada from "./pages/ContaBloqueada";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Helper to check if user is admin based on email domain
const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const domain = email.toLowerCase().split("@")[1];
  return domain?.startsWith("admin") ?? false;
};

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Admin Route - only for @admin emails
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  // Redirect students to student dashboard
  if (!isAdminEmail(currentUser.email)) {
    return <Navigate to="/aluno" replace />;
  }
  
  return <>{children}</>;
};

// Student Route - only for non-admin emails, checks if account is blocked
const StudentRoute = ({ children }: { children: ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  
  useEffect(() => {
    const checkStudentStatus = async () => {
      if (!currentUser?.uid || !db) {
        setCheckingStatus(false);
        return;
      }
      
      try {
        const inforRef = doc(db, `alunos/${currentUser.uid}/infor/infor`);
        const inforSnap = await getDoc(inforRef);
        
        if (inforSnap.exists()) {
          const data = inforSnap.data();
          const status = data.status?.toLowerCase();
          setIsBlocked(status === "cancelado");
        }
      } catch (error) {
        console.error("Erro ao verificar status do aluno:", error);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    if (!loading && currentUser) {
      checkStudentStatus();
    } else if (!loading) {
      setCheckingStatus(false);
    }
  }, [currentUser, loading]);
  
  if (loading || checkingStatus) {
    return <LoadingSpinner />;
  }
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  // Redirect admins to admin dashboard
  if (isAdminEmail(currentUser.email)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Redirect blocked students to blocked page
  if (isBlocked) {
    return <Navigate to="/conta-bloqueada" replace />;
  }
  
  return <>{children}</>;
};

// Blocked account route - only for blocked students
const BlockedRoute = ({ children }: { children: ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  
  useEffect(() => {
    const checkStudentStatus = async () => {
      if (!currentUser?.uid || !db) {
        setCheckingStatus(false);
        return;
      }
      
      try {
        const inforRef = doc(db, `alunos/${currentUser.uid}/infor/infor`);
        const inforSnap = await getDoc(inforRef);
        
        if (inforSnap.exists()) {
          const data = inforSnap.data();
          const status = data.status?.toLowerCase();
          setIsBlocked(status === "cancelado");
        }
      } catch (error) {
        console.error("Erro ao verificar status do aluno:", error);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    if (!loading && currentUser) {
      checkStudentStatus();
    } else if (!loading) {
      setCheckingStatus(false);
    }
  }, [currentUser, loading]);
  
  if (loading || checkingStatus) {
    return <LoadingSpinner />;
  }
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  // If not blocked, redirect to student dashboard
  if (!isBlocked) {
    return <Navigate to="/aluno" replace />;
  }
  
  return <>{children}</>;
};

// Public Route - redirects based on user role
const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (currentUser) {
    // Redirect based on email domain
    if (isAdminEmail(currentUser.email)) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/aluno" replace />;
    }
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route 
      path="/" 
      element={
        <PublicRoute>
          <Index />
        </PublicRoute>
      } 
    />
    {/* Admin routes */}
    <Route 
      path="/dashboard" 
      element={
        <AdminRoute>
          <Dashboard />
        </AdminRoute>
      } 
    />
    <Route 
      path="/alunos" 
      element={
        <AdminRoute>
          <Students />
        </AdminRoute>
      } 
    />
    <Route 
      path="/relatorios" 
      element={
        <AdminRoute>
          <Reports />
        </AdminRoute>
      } 
    />
    <Route 
      path="/cidades-valores" 
      element={
        <AdminRoute>
          <Cities />
        </AdminRoute>
      } 
    />
    <Route 
      path="/mensalidades" 
      element={
        <AdminRoute>
          <Mensalidades />
        </AdminRoute>
      } 
    />
    <Route 
      path="/exame-faixa" 
      element={
        <AdminRoute>
          <ExameFaixas />
        </AdminRoute>
      } 
    />
    <Route 
      path="/horarios" 
      element={
        <AdminRoute>
          <Horarios />
        </AdminRoute>
      } 
    />
    <Route 
      path="/frequencia" 
      element={
        <AdminRoute>
          <Frequencia />
        </AdminRoute>
      } 
    />
    {/* Student routes */}
    <Route 
      path="/aluno" 
      element={
        <StudentRoute>
          <StudentDashboard />
        </StudentRoute>
      } 
    />
    <Route 
      path="/aluno/perfil" 
      element={
        <StudentRoute>
          <StudentProfile />
        </StudentRoute>
      } 
    />
    <Route 
      path="/aluno/mensalidades" 
      element={
        <StudentRoute>
          <StudentMensalidades />
        </StudentRoute>
      } 
    />
    <Route 
      path="/aluno/aulas" 
      element={
        <StudentRoute>
          <StudentAulas />
        </StudentRoute>
      } 
    />
    <Route 
      path="/aluno/notificacoes" 
      element={
        <StudentRoute>
          <StudentNotifications />
        </StudentRoute>
      } 
    />
    {/* Blocked account route */}
    <Route 
      path="/conta-bloqueada" 
      element={
        <BlockedRoute>
          <ContaBloqueada />
        </BlockedRoute>
      } 
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
