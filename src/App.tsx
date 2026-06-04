import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { AppShell } from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import BoardPage from './pages/BoardPage';
import HelpPage from './pages/HelpPage';

export default function App() {
  const init = useAppStore((s) => s.init);
  const loaded = useAppStore((s) => s.loaded);

  useEffect(() => {
    void init();
  }, [init]);

  if (!loaded) {
    return (
      <div className="grid min-h-full place-items-center text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </AppShell>
  );
}
