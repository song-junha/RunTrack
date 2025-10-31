import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RaceListPage from './pages/RaceListPage';
import GroupManagePage from './pages/GroupManagePage';
import TrackingPage from './pages/TrackingPage';
import JTBCMarathonPage from './pages/JTBCMarathonPage';
import { initDB } from './utils/db';
import { useStore } from './store/useStore';

function App() {
  return (
    <Routes>
      <Route path="/jtbc" element={<JTBCMarathonPage />} />
      <Route path="/*" element={<MainApp />} />
    </Routes>
  );
}

function MainApp() {
  const [loading, setLoading] = useState(true);
  const { setDbReady, loadData } = useStore();

  useEffect(() => {
    async function initialize() {
      try {
        await initDB();
        setDbReady(true);
        loadData();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [setDbReady, loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-lg">데이터베이스 초기화 중...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<RaceListPage />} />
        <Route path="race/:raceId/groups" element={<GroupManagePage />} />
        <Route path="race/:raceId/group/:groupId" element={<TrackingPage />} />
      </Route>
    </Routes>
  );
}

export default App;
