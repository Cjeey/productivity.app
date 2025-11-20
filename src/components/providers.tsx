"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
