import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { SchedulePage } from "../features/schedule/SchedulePage";
import { SkillTreePage } from "../features/skillTree/SkillTreePage";
import { ActivitiesPage } from "../features/activities/ActivitiesPage";
import { LoginPage } from "../features/auth/LoginPage";
import { GoalsProvider } from "../contexts/GoalsContext";
import { AuthProvider } from "../contexts/AuthContext";
import { useAuth } from "../contexts/useAuth";
import styles from "./App.module.css";

function AuthenticatedApp() {
  return (
    <GoalsProvider>
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.mainCard}>
          <Routes>
            <Route path="/" element={<Navigate to="/schedule" replace />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/goals" element={<SkillTreePage />} />
          </Routes>
        </div>
      </div>
    </GoalsProvider>
  );
}

function AppShell() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <LoginPage />;

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </HashRouter>
  );
}
