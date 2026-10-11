"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError("That password is not correct.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <a className="login-brand" href="/">
          <span className="brand-mark">P</span>
          <span>
            <strong>papyrus</strong>
            <small>ADMIN STUDIO</small>
          </span>
        </a>
        <p className="eyebrow">PRIVATE WORKSPACE</p>
        <h1>Welcome back.</h1>
        <p className="login-copy">
          Sign in to manage papers, boards, and the review queue.
        </p>
        <form onSubmit={submit} className="login-form">
          <label>
            Admin password
            <span className="input-with-icon">
              <LockKeyhole size={16} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoFocus
                required
              />
            </span>
          </label>
          {error && <p className="login-error">{error}</p>}
          <button className="button-primary" disabled={loading}>
            <LogIn size={16} />
            {loading ? "Checking..." : "Enter admin studio"}
          </button>
        </form>
        <p className="login-note">
          Development password: <code>papyrus-admin</code>. Set{" "}
          <code>ADMIN_PASSWORD</code> before deployment.
        </p>
      </div>
    </main>
  );
}
