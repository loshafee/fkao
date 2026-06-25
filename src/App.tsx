import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import WrongBookPage from './pages/WrongBookPage';
import HistoryDetailPage from './pages/HistoryDetailPage';
import NotesPage from './pages/NotesPage';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/exam" element={<ExamPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:index" element={<HistoryDetailPage />} />
            <Route path="/wrongbook" element={<WrongBookPage />} />
            <Route path="/notes" element={<NotesPage />} />
          </Routes>
        </div>
      </HashRouter>
    </AppProvider>
  );
}
