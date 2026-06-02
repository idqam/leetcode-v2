"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/", label: "Bank" },
  { href: "/bank", label: "Tracker" },
  { href: "/patterns", label: "Patterns" },
  { href: "/dashboard", label: "Dashboard" },
];

const HIDE_NAV_ON = ["/landing", "/login", "/signup"];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (HIDE_NAV_ON.includes(pathname)) return null;

  async function handleSignOut() {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        return;
      }
      router.push("/landing");
      router.refresh();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  }

  return (
    <nav className="border-b border-[#D4CFC6] dark:border-[#2A3A4A] bg-[#F7F5F0] dark:bg-[#0F1419]">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center text-sm font-medium">
        <Link
          href="/"
          className="text-sm font-bold text-[#1C2B3A] dark:text-[#E8EDF2] shrink-0"
        >
          LeetCode Tracker
        </Link>
        <div className="flex-1 flex justify-center gap-6">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`pb-0.5 border-b-2 transition-colors ${
                  active
                    ? "border-[#3D7EAA] text-[#1C2B3A] dark:text-[#E8EDF2]"
                    : "border-transparent text-[#6B7F8E] hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <button
          onClick={handleSignOut}
          className="shrink-0 text-[#6B7F8E] hover:text-[#B54A4A] dark:hover:text-[#D46A6A] text-xs transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
