
import { useState } from "react";
import "./login.css";

const API = "http://localhost:5000";

export default function Login({ onLogin }) {
  const [role, setRole] = useState("student");
  const [rollNo, setRollNo] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const endpoint =
      role === "student"
        ? `${API}/api/student/login`
        : `${API}/api/admin/login`;

    const body =
      role === "student"
        ? { roll_no: rollNo.trim(), password }
        : { username: username.trim(), password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Login failed. Try again.");
      }

      const loggedInRole = data.role || role;
      const loggedInRollNo = data.roll_no || rollNo.trim();

      sessionStorage.setItem("role", loggedInRole);

      if (loggedInRole === "student") {
        sessionStorage.setItem("rollNo", loggedInRollNo);
        sessionStorage.setItem("roll_no", loggedInRollNo);
      }

      onLogin(loggedInRole, loggedInRollNo);
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Backend start cheyyi: http://localhost:5000"
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="color-blob blob-one" />
      <div className="color-blob blob-two" />
      <div className="color-blob blob-three" />

      <section className="login-layout">
        <div className="welcome-panel">
          <div className="brand">
            <div className="brand-icon">✦</div>
            <span>CampusVoice</span>
          </div>

          <div className="welcome-content">
            <span className="eyebrow">YOUR CAMPUS. YOUR VOICE.</span>

            <h1>
              Make Your
              <br />
              <span>Voice</span> Matter!
            </h1>

            <p>
              Your feedback can inspire better teaching,
              stronger connections and a brighter campus.
              Share your thoughts and make a difference.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon pink-icon">✦</span>
                <div>
                  <strong>Share Your Thoughts</strong>
                  <small>Your opinion truly matters</small>
                </div>
              </div>

              <div className="feature-item">
                <span className="feature-icon orange-icon">★</span>
                <div>
                  <strong>Build a Better Campus</strong>
                  <small>Help improve learning experiences</small>
                </div>
              </div>
            </div>
          </div>

          <div className="welcome-bottom">
            <span className="sparkle">✧</span>
            Every voice creates a positive change.
          </div>

          <div className="floating-star star-one">✦</div>
          <div className="floating-star star-two">✧</div>
          <div className="floating-circle circle-one" />
          <div className="floating-circle circle-two" />
        </div>

        <div className="form-panel">
          <div className="form-top">
            <div className="mobile-brand">
              <span>✦</span> CampusVoice
            </div>

            <div className="form-heading">
              <div className="form-icon">👋</div>
              <h2>Welcome Back!</h2>
              <p>Sign in to continue your journey.</p>
            </div>
          </div>

          <div className="role-label">CHOOSE YOUR ACCOUNT</div>

          <div className="role-tabs">
            <button
              type="button"
              className={role === "student" ? "active student-active" : ""}
              onClick={() => {
                setRole("student");
                setMessage("");
              }}
            >
              <span className="tab-icon">🎓</span>
              Student
            </button>

            <button
              type="button"
              className={role === "admin" ? "active admin-active" : ""}
              onClick={() => {
                setRole("admin");
                setMessage("");
              }}
            >
              <span className="tab-icon">🛡️</span>
              Admin
            </button>
          </div>

          <form onSubmit={handleLogin}>
            {role === "student" ? (
              <>
                <label htmlFor="rollNo">Roll Number</label>
                <div className="input-wrap">
                  <span className="input-icon">🎓</span>
                  <input
                    id="rollNo"
                    type="text"
                    placeholder="Enter your roll number"
                    value={rollNo}
                    onChange={(event) => setRollNo(event.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <label htmlFor="username">Admin Username</label>
                <div className="input-wrap">
                  <span className="input-icon">👤</span>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </>
            )}

            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {message && (
              <div className="login-message" role="alert">
                {message}
              </div>
            )}

            <button
              className={`login-button ${role}-button`}
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              <span>→</span>
            </button>
          </form>

          <div className="secure-note">
            <span>✧</span>
            Your campus journey starts here.
          </div>

          <div className="form-footer">
            STUDENT FEEDBACK SYSTEM <span>•</span> CAMPUSVOICE
          </div>
        </div>
      </section>
    </main>
  );
}
