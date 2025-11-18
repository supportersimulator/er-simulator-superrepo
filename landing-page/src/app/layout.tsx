// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ER Simulator – Emergency Medicine Training That Feels Real",
  description:
    "AI-powered emergency medicine simulations with live vitals, voice, and adaptive cases. Built for PAs, physicians, residents, and EM clinicians.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}