import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Akwaaba Night | Official Voting",
  description: "The official Akwaaba Night voting portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
