import { Routes, Route, Navigate } from 'react-router-dom';
import JTBCMarathonPage from './pages/JTBCMarathonPage';

function App() {
  return (
    <Routes>
      <Route path="/jtbc" element={<JTBCMarathonPage />} />
      <Route path="/" element={<Navigate to="/jtbc" replace />} />
      <Route path="*" element={<Navigate to="/jtbc" replace />} />
    </Routes>
  );
}

export default App;
