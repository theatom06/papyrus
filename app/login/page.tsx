"use client";

import "./style.css";

import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageTitle } from "@/components/page-title";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/components/toast";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      showToast("Signed into Admin Studio successfully", "success");
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : "Login failed.";
      setError(msg);
      showToast(msg, "error");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="login-page">
      <PageTitle title="Admin login" />
      <div className="login-card">
        <a className="login-brand" href="/">
          <img src="/logo.svg" alt="Papyrus logo" className="brand-logo" />
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
          The administrator password is verified securely on the server.
        </p>
      </div>
    </main>
  );
}
