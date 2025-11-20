import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { InitializeDB } from "@/components/initialize-db";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"] });

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
    <html
      lang="en"
      className={geist.className}
    >
      <body>
        <InitializeDB />
        <SidebarProvider>
          <AppSidebar />
          <main className="w-full flex flex-col bg-white min-h-screen">
            <Navigation />
            <div className="flex-1 bg-white">{children}</div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
