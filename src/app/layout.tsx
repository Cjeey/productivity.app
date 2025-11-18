import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/app-shell";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "FocusFlow | Personal Productivity",
  description: "Plan tasks, deadlines, timetable, and focus sessions in one dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
