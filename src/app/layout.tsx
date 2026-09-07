import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./components/layout/AppShell";

export const metadata: Metadata = {
  title: "DCA-MEXC Trading Terminal",
  description: "Live DCA trading management terminal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
