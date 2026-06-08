import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';
import { AppShell } from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import BoardPage from './pages/BoardPage';
import HelpPage from './pages/HelpPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  const token = useAuthStore((s) => s.token);
  const init = useAppStore((s) => s.init);
  const loaded = useAppStore((s) => s.loaded);

  useEffect(() => {
    void init(token ?? undefined);
  }, [init, token]);

  if (!token) {
    return <LoginPage />;
  }

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
