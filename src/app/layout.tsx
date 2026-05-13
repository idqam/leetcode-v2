import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = { title: "LeetCode Tracker" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#F7F5F0] dark:bg-[#0F1419] text-[#1C2B3A] dark:text-[#E8EDF2] min-h-screen antialiased">
        <nav className="border-b border-[#D4CFC6] dark:border-[#2A3A4A] px-6 py-3 flex items-center gap-6 text-sm font-medium bg-[#F7F5F0] dark:bg-[#0F1419]">
          <Link href="/" className="text-base font-bold text-[#1C2B3A] dark:text-[#E8EDF2]">LeetCode Tracker</Link>
          <Link href="/" className="text-[#6B7F8E] hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2] transition-colors">Bank</Link>
          <Link href="/tracker" className="text-[#6B7F8E] hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2] transition-colors">Tracker</Link>
          <Link href="/patterns" className="text-[#6B7F8E] hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2] transition-colors">Patterns</Link>
          <Link href="/dashboard" className="text-[#6B7F8E] hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2] transition-colors">Dashboard</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
