import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FullPageLoader } from './components/common/Spinner';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AllDocumentsPage from './pages/dashboard/AllDocumentsPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import CategoryDetailsPage from './pages/categories/CategoryDetailsPage';
import ProfilePage from './pages/settings/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
import ActivityLogPage from './pages/dashboard/ActivityLogPage';
import SharedDocumentPage from './pages/share/SharedDocumentPage';
import NotFoundPage from './pages/NotFoundPage';
import TermsPrivacyPage from './pages/legal/TermsPrivacyPage';
import FoldersPage from './pages/folders/FoldersPage';
import FolderDetailPage from './pages/folders/FolderDetailPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <FullPageLoader label="Opening Vault" sublabel="Verifying identity..." />;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

const AppRouter = () => {
  const { loading } = useAuth();

  if (loading) {
    return <FullPageLoader label="Locker 24" sublabel="Initialising secure environment..." />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/terms" element={<TermsPrivacyPage />} />
      <Route path="/privacy" element={<TermsPrivacyPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />

      <Route path="/documents" element={
        <ProtectedRoute>
          <AllDocumentsPage />
        </ProtectedRoute>
      } />

      <Route path="/categories" element={
        <ProtectedRoute>
          <CategoriesPage />
        </ProtectedRoute>
      } />

      <Route path="/categories/:id" element={
        <ProtectedRoute>
          <CategoryDetailsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/activity" element={
        <ProtectedRoute>
          <ActivityLogPage />
        </ProtectedRoute>
      } />

      <Route path="/folders" element={
        <ProtectedRoute>
          <FoldersPage />
        </ProtectedRoute>
      } />

      <Route path="/folders/:id" element={
        <ProtectedRoute>
          <FolderDetailPage />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />

      {/* Public Share Route */}
      <Route path="/shared/:token" element={<SharedDocumentPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
