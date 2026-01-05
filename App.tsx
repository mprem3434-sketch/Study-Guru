
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SubjectDetail } from './pages/SubjectDetail';
import { TopicView } from './pages/TopicView';
import { SubjectsPage } from './pages/SubjectsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SearchPage } from './pages/SearchPage';
import { DownloadsPage } from './pages/DownloadsPage';

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
