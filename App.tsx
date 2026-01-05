import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { SubjectDetail } from './pages/SubjectDetail.tsx';
import { TopicView } from './pages/TopicView.tsx';
import { SubjectsPage } from './pages/SubjectsPage.tsx';
import { FavoritesPage } from './pages/FavoritesPage.tsx';
import { StatsPage } from './pages/StatsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { SearchPage } from './pages/SearchPage.tsx';
import { DownloadsPage } from './pages/DownloadsPage.tsx';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subject/:id" element={<SubjectDetail />} />
          <Route path="/topic/:id" element={<TopicView />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;