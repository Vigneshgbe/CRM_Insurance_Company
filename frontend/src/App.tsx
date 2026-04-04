import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import AuthGuard from "@/components/AuthGuard";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import NewClient from "./pages/NewClient";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import Documents from "./pages/Documents";
import Templates from "./pages/Templates";
import TemplateEditor from "./pages/TemplateEditor";
import DocumentEditor from "./pages/DocumentEditor";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ClientPortal from "./pages/ClientPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* Employee routes */}
          <Route path="/dashboard" element={<AuthGuard allowedRoles={["employee"]}><Dashboard /></AuthGuard>} />
          <Route path="/clients" element={<AuthGuard allowedRoles={["employee"]}><Clients /></AuthGuard>} />
          <Route path="/clients/new" element={<AuthGuard allowedRoles={["employee"]}><NewClient /></AuthGuard>} />
          <Route path="/cases" element={<AuthGuard allowedRoles={["employee"]}><Cases /></AuthGuard>} />
          <Route path="/documents" element={<AuthGuard allowedRoles={["employee"]}><Documents /></AuthGuard>} />
          <Route path="/templates" element={<AuthGuard allowedRoles={["employee"]}><Templates /></AuthGuard>} />
          <Route path="/templates/editor" element={<AuthGuard allowedRoles={["employee"]}><TemplateEditor /></AuthGuard>} />
          <Route path="/editor" element={<AuthGuard allowedRoles={["employee"]}><DocumentEditor /></AuthGuard>} />
          <Route path="/cases/:caseId" element={<AuthGuard allowedRoles={["employee"]}><CaseDetail /></AuthGuard>} />
          <Route path="/cases/:caseId/:tab" element={<AuthGuard allowedRoles={["employee"]}><CaseDetail /></AuthGuard>} />
          <Route path="/reports" element={<AuthGuard allowedRoles={["employee"]}><Reports /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard allowedRoles={["employee"]}><Settings /></AuthGuard>} />
          {/* Client portal */}
          <Route path="/portal" element={<AuthGuard allowedRoles={["client"]}><ClientPortal /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
