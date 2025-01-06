import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './components/auth/AuthProvider';
import { SupabaseProvider } from '@/lib/supabase/supabase-provider';
import { Toaster } from './components/ui/ToastProvider';

// Components
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ResetPassword } from './components/auth/ResetPassword';
import { UpdatePassword } from './components/auth/UpdatePassword';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { Overview } from './components/dashboard/Overview';
import { ProfilePage } from './components/profile/ProfilePage';
import { SettingsPage } from './components/settings/SettingsPage';
import { TemplateList } from './components/templates/TemplateList';
import { NewTemplatePage } from './components/templates/NewTemplatePage';
import { UploadTemplatePage } from './components/templates/UploadTemplatePage';
import { TemplateView } from './components/templates/TemplateView';
import { TemplateEditor } from './components/templates/TemplateEditor';
import { CertificatesPage } from './components/certificates/CertificatesPage';
import { NewCertificatePage } from './components/certificates/NewCertificatePage';
import { CertificateView } from './components/certificates/CertificateView';
import { CertificateList } from './components/certificates/CertificateList';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { AdminRoute } from './components/admin/AdminRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { SystemSettings } from './components/admin/SystemSettings';
import { UsageStatistics } from './components/admin/UsageStatistics';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DataManagement } from './components/data/DataManagement';
import { CSVUpload } from './components/data/CSVUpload';
import { DataPreview } from './components/data/DataPreview';
import { FieldMapping } from './components/data/FieldMapping';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />

              {/* Protected dashboard routes */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }>
                <Route index element={<Overview />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="templates">
                  <Route index element={<TemplateList />} />
                  <Route path="new" element={<NewTemplatePage />} />
                  <Route path="upload" element={<UploadTemplatePage />} />
                  <Route path=":id" element={<TemplateView />} />
                  <Route path=":id/edit" element={<TemplateEditor />} />
                </Route>
                <Route path="certificates">
                  <Route index element={<CertificatesPage />} />
                  <Route path="new" element={<NewCertificatePage />} />
                  <Route path=":id" element={<CertificateView />} />
                  <Route path="list" element={<CertificateList />} />
                </Route>
                <Route path="data">
                  <Route index element={<DataManagement />} />
                  <Route path="upload" element={<CSVUpload />} />
                  <Route path="preview" element={<DataPreview />} />
                  <Route path="mapping" element={<FieldMapping />} />
                </Route>
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              } />

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
          <Toaster />
        </BrowserRouter>
      </SupabaseProvider>
    </QueryClientProvider>
  );
}

export default App;