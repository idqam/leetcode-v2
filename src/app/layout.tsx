import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = { title: "LeetCode Tracker" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#F7F5F0] dark:bg-[#0F1419] text-[#1C2B3A] dark:text-[#E8EDF2] min-h-screen antialiased">
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
