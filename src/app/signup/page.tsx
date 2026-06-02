"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "confirm">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    setStatus("submitting");
    setErrorMsg(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("idle");
      setErrorMsg(error.message);
      return;
    }

    // If email confirmation is disabled, Supabase returns a session immediately.
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    // Otherwise a confirmation email was sent.
    setStatus("confirm");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5F0] to-[#EDEAE3] dark:from-[#0F1419] dark:to-[#0A0F14] flex flex-col">
      <nav className="max-w-5xl w-full mx-auto px-8 py-6 flex justify-between items-center">
        <Link
          href="/landing"
          className="font-bold text-[15px] tracking-tight text-[#1C2B3A] dark:text-[#E8EDF2]"
        >
          LeetCode Tracker<span className="text-[#4A8C6F]">.</span>
        </Link>
        <Link
          href="/login"
          className="text-[13px] text-[#6B7F8E] hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2] transition-colors"
        >
          Already have an account? Sign in →
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-8 -mt-12">
        <div className="w-full max-w-[400px]">
          <h1
            className="text-[36px] leading-[1.15] text-[#1C2B3A] dark:text-[#E8EDF2] mb-3 text-center"
            style={{ fontFamily: "Georgia, serif", fontWeight: 400 }}
          >
            Get started.
          </h1>
          <p className="text-center text-[14px] text-[#6B7F8E] mb-10">
            Create an account with your email and a password.
          </p>

          {status === "confirm" ? (
            <div className="bg-[#D4EDE3] dark:bg-[#1A3D2E] border border-[#5FAD8A] dark:border-[#4A8C6F] rounded-xl p-5 text-center">
              <div className="text-[#4A8C6F] dark:text-[#9FCFB8] text-[15px] font-medium mb-1">
                Confirm your email
              </div>
              <p className="text-[13px] text-[#6B7F8E]">
                We sent a confirmation link to <strong>{email}</strong>. Click it to
                activate your account, then sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[11px] uppercase tracking-wider font-semibold text-[#6B7F8E] mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F7F5F0] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-lg px-4 py-3 text-[14px] text-[#1C2B3A] dark:text-[#E8EDF2] placeholder-[#6B7F8E] focus:outline-none focus:border-[#3D7EAA] focus:ring-2 focus:ring-[#3D7EAA]/20 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[11px] uppercase tracking-wider font-semibold text-[#6B7F8E] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F7F5F0] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-lg px-4 py-3 text-[14px] text-[#1C2B3A] dark:text-[#E8EDF2] placeholder-[#6B7F8E] focus:outline-none focus:border-[#3D7EAA] focus:ring-2 focus:ring-[#3D7EAA]/20 transition-colors"
                />
              </div>

              {errorMsg && (
                <div className="text-[13px] text-[#B54A4A] dark:text-[#D46A6A] bg-[#F5DADA] dark:bg-[#3D1A1A] border border-[#D46A6A] rounded-lg px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-[#3D7EAA] hover:bg-[#2E6A94] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg text-[14px] font-medium transition-colors"
              >
                {status === "submitting" ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          <p className="text-center text-[12px] text-[#6B7F8E] mt-8">
            <Link href="/landing" className="hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2] underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
