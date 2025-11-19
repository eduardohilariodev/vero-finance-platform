import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { InitializeDB } from "@/components/initialize-db";

export const metadata: Metadata = {
  title: "Vero Finance",
  description: "Financial management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <InitializeDB />
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
