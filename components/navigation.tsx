"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navigation() {
  return (
    <nav className="border-b p-4 flex justify-between items-center bg-slate-50">
      <Link
        href="/"
        className="font-bold text-xl"
      >
        Vero Finance
      </Link>
      <div className="flex gap-4">
        <Link href="/companies">
          <Button variant="ghost">Companies</Button>
        </Link>
      </div>
    </nav>
  );
}
