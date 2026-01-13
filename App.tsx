
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { Loader2 } from 'lucide-react';

// Lazy load pages to improve initial load performance (Lighthouse Performance)
const Dashboard = lazy(() => import('./pages/Dashboard.tsx').then(module => ({ default: module.Dashboard })));
const SubjectDetail = lazy(() => import('./pages/SubjectDetail.tsx').then(module => ({ default: module.SubjectDetail })));
const TopicView = lazy(() => import('./pages/TopicView.tsx').then(module => ({ default: module.TopicView })));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage.tsx').then(module => ({ default: module.SubjectsPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.tsx').then(module => ({ default: module.FavoritesPage })));
const StatsPage = lazy(() => import('./pages/StatsPage.tsx').then(module => ({ default: module.StatsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.tsx').then(module => ({ default: module.SettingsPage })));
const SearchPage = lazy(() => import('./pages/SearchPage.tsx').then(module => ({ default: module.SearchPage })));
const DownloadsPage = lazy(() => import('./pages/DownloadsPage.tsx').then(module => ({ default: module.DownloadsPage })));
const LoginPage = lazy(() => import('./pages/LoginPage.tsx').then(module => ({ default: module.LoginPage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.tsx').then(module => ({ default: module.AdminDashboard })));
const AdminStudentDetail = lazy(() => import('./pages/AdminStudentDetail.tsx').then(module => ({ default: module.AdminStudentDetail })));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard.tsx').then(module => ({ default: module.TeacherDashboard })));
const FeesManagement = lazy(() => import('./pages/FeesManagement.tsx').then(module => ({ default: module.FeesManagement })));
const RevenueAnalytics = lazy(() => import('./pages/RevenueAnalytics.tsx').then(module => ({ default: module.RevenueAnalytics })));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh]">
    <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
      <Loader2 className="animate-spin text-indigo-600" size={24} />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Resources...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/admin/student/:id" element={<AdminStudentDetail />} />
            <Route path="/admin/fees" element={<FeesManagement />} />
            <Route path="/admin/revenue" element={<RevenueAnalytics />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/subject/:id" element={<SubjectDetail />} />
            <Route path="/topic/:id" element={<TopicView />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;
