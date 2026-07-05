import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/login/LoginPage';
import { BoardPage } from './pages/kanban/BoardPage';
import { BoardsOverviewPage } from './pages/tableros/BoardsOverviewPage';
import { UsersPage } from './pages/users/UsersPage';
import { BandejaPage } from './pages/bandeja/BandejaPage';
import { CambiarPasswordPage } from './pages/cambiar-password/CambiarPasswordPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

function App() {
  const token = useAuthStore((s) => s.token);

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/tableros" replace /> : <LoginPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/kanban" element={<BoardPage />} />
        <Route path="/kanban/:boardId" element={<BoardPage />} />
        <Route path="/tableros" element={<BoardsOverviewPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/bandeja" element={<BandejaPage />} />
        <Route path="/cambiar-password" element={<CambiarPasswordPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/tableros" replace />} />
    </Routes>
  );
}

export default App;
