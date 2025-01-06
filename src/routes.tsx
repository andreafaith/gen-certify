import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/auth/AuthProvider';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ResetPassword } from './components/auth/ResetPassword';
import { UpdatePassword } from './components/auth/UpdatePassword';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { TemplateList } from './components/templates/TemplateList';
import { NewTemplatePage } from './components/templates/NewTemplatePage';
import { TemplateView } from './components/templates/TemplateView';
import { TemplateEditor } from './components/templates/TemplateEditor';
import { Overview } from './components/dashboard/Overview';
import { ProfilePage } from './components/profile/ProfilePage';
import { CertificateList } from './components/certificates/CertificateList';
import { NewCertificatePage } from './components/certificates/NewCertificatePage';
import { CertificateView } from './components/certificates/CertificateView';
import { CertificatesPage } from './components/certificates/CertificatesPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { CSVUpload } from './components/data/CSVUpload';
import { DataPreview } from './components/data/DataPreview';
import { FieldMapping } from './components/data/FieldMapping';
import { DataManagement } from './components/data/DataManagement';

export function AppRoutes() {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={auth.session ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={auth.session ? <Navigate to="/dashboard" /> : <RegisterPage />}
      />
      <Route
        path="/reset-password"
        element={auth.session ? <Navigate to="/dashboard" /> : <ResetPassword />}
      />
      <Route
        path="/update-password"
        element={<UpdatePassword />}
      />
      <Route
        path="/dashboard"
        element={auth.session ? <DashboardLayout /> : <Navigate to="/login" />}
      >
        <Route index element={<Overview />} />
        <Route path="templates">
          <Route index element={<TemplateList />} />
          <Route path="new" element={<NewTemplatePage />} />
          <Route path=":id" element={<TemplateView />} />
          <Route path=":id/edit" element={<TemplateEditor />} />
        </Route>
        <Route path="certificates">
          <Route index element={<CertificatesPage />} />
          <Route path="new" element={<NewCertificatePage />} />
          <Route path=":id" element={<CertificateView />} />
          <Route path="list" element={<CertificateList />} />
        </Route>
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="data">
          <Route index element={<DataManagement />} />
          <Route path="upload" element={<CSVUpload />} />
          <Route path="preview" element={<DataPreview />} />
          <Route path="mapping" element={<FieldMapping />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}