import { useEffect, useState } from "react";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import { auth } from "./api/client";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const session = auth.loadSession();
    if (session) setUser(session.user);
    setChecked(true);
  }, []);

  const handleLogout = () => {
    auth.logout();
    setUser(null);
  };

  if (!checked) return null;
  if (!user) return <Login onAuth={setUser} />;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Ticket Desk</h1>
          <p className="muted">
            Signed in as {user.name || user.username} · {user.role}
          </p>
        </div>
        <button className="ghost" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <main>{user.role === "ADMIN" ? <AdminDashboard /> : <UserDashboard />}</main>
    </div>
  );
}
