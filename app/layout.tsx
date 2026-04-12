import "./globals.css";
import type { Metadata } from "next";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Findr — The Move Is Here",
  description: "Every party. Every app. One map.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ paddingBottom: "5rem" }}>
        <main className="max-w-md mx-auto">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
