import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RoW Leaderboards",
  description: "Root of War Leaderboards",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
