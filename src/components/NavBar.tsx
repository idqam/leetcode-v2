"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Bank" },
  { href: "/bank", label: "Tracker" },
  { href: "/patterns", label: "Patterns" },
  { href: "/dashboard", label: "Dashboard" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[#D4CFC6] dark:border-[#2A3A4A] bg-[#F7F5F0] dark:bg-[#0F1419]">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-6 text-sm font-medium">
        <Link
          href="/"
          className="text-base font-bold text-[#1C2B3A] dark:text-[#E8EDF2] mr-4 shrink-0"
        >
          LeetCode Tracker
        </Link>
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
    </nav>
  );
}
