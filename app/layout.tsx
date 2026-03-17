import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/app/components/ui/useToast";

export const metadata: Metadata = {
  title: "Hydra Escrow Devnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f8fafc] text-[#1e293b] antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
