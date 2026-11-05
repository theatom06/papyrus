"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import ThemeToggle from "@/components/theme-toggle";

export function LoginPage() {
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
    <main className="relative grid min-h-screen place-items-center bg-sand px-6 py-6 text-ink">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[410px] rounded-lg border border-border-main bg-linen px-9 py-9 shadow-sm">
        <a
          className="mb-12 inline-flex items-center gap-2.5 text-ink no-underline"
          href="/"
        >
          <img src="/logo.svg" alt="Papyrus logo" className="size-[35px]" />
          <span>
            <strong className="block font-serif text-lg">papyrus</strong>
            <small className="mt-0.5 block font-mono text-[8px] tracking-[0.14em] text-slate">
              ADMIN STUDIO
            </small>
          </span>
        </a>
        <p className="font-mono text-[9px] tracking-[0.14em] text-amber">
          PRIVATE WORKSPACE
        </p>
        <h1 className="mt-3 font-serif text-[31px] tracking-[-0.04em]">
          Welcome back.
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-slate">
          Sign in to manage papers, boards, and the review queue.
        </p>
        <form onSubmit={submit} className="mt-7 grid gap-[18px]">
          <label className="grid gap-2 text-[11px] font-semibold text-ink">
            Admin password
            <span className="flex min-h-11 items-center gap-2 rounded-[5px] border border-border-main bg-sand px-3 text-slate focus-within:border-amber">
              <LockKeyhole size={16} />
              <input
                className="w-full border-0 bg-transparent text-[13px] text-ink outline-none placeholder:text-slate"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoFocus
                required
              />
            </span>
          </label>
          {error && <p className="-mt-1.5 text-xs text-rose-500">{error}</p>}
          <button
            className="inline-flex min-h-[43px] items-center justify-center gap-2 rounded-[5px] border-0 bg-amber text-xs font-bold text-white transition hover:bg-amber-dark disabled:cursor-wait disabled:opacity-65"
            disabled={loading}
          >
            <LogIn size={16} />
            {loading ? "Checking..." : "Enter admin studio"}
          </button>
        </form>
        <p className="mt-6 border-t border-border-main pt-[18px] font-mono text-[9px] leading-relaxed text-slate">
          The administrator password is verified securely on the server.
        </p>
      </div>
    </main>
  );
}

export default LoginPage;
