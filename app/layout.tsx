import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Epoch — Explore World History",
  description: "A premium interactive atlas for exploring global history and testing your knowledge.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

