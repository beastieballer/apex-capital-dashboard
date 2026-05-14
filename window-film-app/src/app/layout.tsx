import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FilmFlow Pro | Window Film Management",
  description: "Professional window film job management for installers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
