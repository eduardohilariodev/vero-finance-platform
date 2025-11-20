"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export function Navigation() {
  return (
    <nav className="p-6 px-8 flex items-center justify-between bg-white">
      <div className="flex items-center">
        <span className="text-xl text-gray-800">Hello, Marcos</span>
      </div>
      <div className="flex items-center gap-3">
        {/* Add Funds */}
        <Link href="/funds/add">
          <Button
            variant="ghost"
            className="text-sm font-medium flex items-center gap-2 text-gray-700 hover:bg-gray-50"
          >
            <ArrowDown size={16} />
            Add Funds
          </Button>
        </Link>

        {/* Request Payment */}
        <Link href="/payments/request">
          <Button
            variant="ghost"
            className="text-sm font-medium flex items-center gap-2 text-gray-700 hover:bg-gray-50"
          >
            <ArrowDownLeft size={16} />
            Request Payment
          </Button>
        </Link>

        {/* Send Payment (Default/Primary Button) */}
        <Link href="/payments/send">
          <Button
            className="px-5" // Uses default primary styles defined in Tailwind config
          >
            <ArrowUpRight
              size={16}
              className="mr-2"
            />
            Send Payment
          </Button>
        </Link>
      </div>
    </nav>
  );
}
