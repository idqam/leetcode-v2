"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setStatus("error");
      // shouldCreateUser:false → Supabase rejects unknown emails. Surface a
      // clear message instead of the raw "Signups not allowed for otp" text.
      const isUnknownUser =
        error.status === 422 || /signups not allowed|not found/i.test(error.message);
      setErrorMsg(
        isUnknownUser
          ? "No account found for that email. Sign up to get started."
          : error.message
      );
    } else {
      setStatus("sent");
    }
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
          href="/signup"
          className="text-[13px] text-[#6B7F8E] hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2] transition-colors"
        >
          Don&apos;t have an account? Sign up →
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-8 -mt-12">
        <div className="w-full max-w-[400px]">
          <h1
            className="text-[36px] leading-[1.15] text-[#1C2B3A] dark:text-[#E8EDF2] mb-3 text-center"
            style={{ fontFamily: "Georgia, serif", fontWeight: 400 }}
          >
            Welcome back.
          </h1>
          <p className="text-center text-[14px] text-[#6B7F8E] mb-10">
            We&apos;ll send a magic link to your email — no password needed.
          </p>

          {status === "sent" ? (
            <div className="bg-[#D4EDE3] dark:bg-[#1A3D2E] border border-[#5FAD8A] dark:border-[#4A8C6F] rounded-xl p-5 text-center">
              <div className="text-[#4A8C6F] dark:text-[#9FCFB8] text-[15px] font-medium mb-1">
                Check your inbox
              </div>
              <p className="text-[13px] text-[#6B7F8E]">
                We sent a magic link to <strong>{email}</strong>. Click it to sign in.
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
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                disabled={status === "sending"}
                className="w-full bg-[#3D7EAA] hover:bg-[#2E6A94] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg text-[14px] font-medium transition-colors"
              >
                {status === "sending" ? "Sending…" : "Send magic link"}
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
