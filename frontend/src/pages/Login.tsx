import { useState } from "react";
import type React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import styles from "./Login.module.scss";

type Tab = "login" | "register";

export default function Login() {
  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithSteam } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Where to return after a successful auth: the path the ProtectedRoute
  // bounced us from, or the dashboard.
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const backendUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <h1>Satisfactory Factory Manager</h1>
          <p>Sign in to sync your factories</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "login" ? styles.active : ""}`}
            onClick={() => setTab("login")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`${styles.tab} ${tab === "register" ? styles.active : ""}`}
            onClick={() => setTab("register")}
            type="button"
          >
            Register
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={64}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Please wait…" : (tab === "login" ? "Sign in" : "Create account")}
          </button>
        </form>

        <div className={styles.divider}>or continue with</div>

        <button
          className={styles.steamBtn}
          type="button"
          onClick={() => loginWithSteam(backendUrl)}
        >
          <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 7.68 5.412 14.1 12.7 15.6l4.6-9.4c-0.1 0-0.2 0-0.3 0-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6c0 2.9-2.06 5.32-4.8 5.87l-4.5 9.2C25.4 29.76 32 23.5 32 16c0-8.837-7.163-16-16-16zm0 8c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 3c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z" />
          </svg>
          Sign in with Steam
        </button>

        <button className={styles.epicBtn} type="button" disabled>
          Epic Games — Coming soon
        </button>
      </div>
    </div>
  );
}
