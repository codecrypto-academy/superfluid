import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Superfluid EUR Streaming",
  description: "Stream EUR tokens using Superfluid protocol",
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
