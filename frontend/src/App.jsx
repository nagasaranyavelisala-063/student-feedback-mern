
import { useState } from "react";
import Login from "./Login";
import Student from "./Student";
import Admin from "./Admin";
import "./App.css";

export default function App() {
  const [role, setRole] = useState(
    sessionStorage.getItem("role") || ""
  );

  function login(selectedRole, rollNo = "") {
    sessionStorage.setItem("role", selectedRole);

    if (rollNo) {
      sessionStorage.setItem("rollNo", rollNo);
    }

    setRole(selectedRole);
  }

  function logout() {
    sessionStorage.clear();
    setRole("");
  }

  return (
    <div className="app">
      {role && (
        <header className="topbar">
          <div className="brand">
            <span className="brand-icon">✦</span>
            CampusVoice
          </div>

          <span className="topbar-label">
            Student Feedback System
          </span>

          <button className="logout-btn" onClick={logout}>
            Logout ↗
          </button>
        </header>
      )}

      {!role && <Login onLogin={login} />}
      {role === "student" && <Student />}
      {role === "admin" && <Admin />}
    </div>
  );
}
