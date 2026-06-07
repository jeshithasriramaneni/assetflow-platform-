import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AssetsPage } from './pages/admin/AssetsPage';
import { BookingsAdminPage } from './pages/admin/BookingsAdminPage';
import { UsersPage } from './pages/admin/UsersPage';
import { AuditPage } from './pages/admin/AuditPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';

// User pages
import { UserDashboard } from './pages/user/UserDashboard';
import { BrowseAssetsPage } from './pages/user/BrowseAssetsPage';
import { MyBookingsPage } from './pages/user/MyBookingsPage';
import { AssetDetailPage } from './pages/AssetDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        {/* Redirect root to appropriate dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard - role-based */}
        <Route path="dashboard" element={user?.role === 'ADMIN' ? <AdminDashboard /> : <UserDashboard />} />

        {/* Asset detail (shared) */}
        <Route path="assets/:id" element={<AssetDetailPage />} />

        {/* Profile & Notifications (shared) */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />

        {/* User routes */}
        <Route path="browse" element={<BrowseAssetsPage />} />
        <Route path="my-bookings" element={<MyBookingsPage />} />

        {/* Admin routes */}
        <Route path="admin">
          <Route path="assets" element={<AdminRoute><AssetsPage /></AdminRoute>} />
          <Route path="bookings" element={<AdminRoute><BookingsAdminPage /></AdminRoute>} />
          <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="categories" element={<AdminRoute><CategoriesPage /></AdminRoute>} />
          <Route path="analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />
          <Route path="audit" element={<AdminRoute><AuditPage /></AdminRoute>} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
