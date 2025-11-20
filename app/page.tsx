"use client";
import { useEffect, useState } from "react";
import { useDB } from "@/hooks/useDB";
import { useBalance } from "@/hooks/useBalance";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Transaction } from "@/lib/types";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Sparkles,
  CheckCircle2,
  Clock,
  Landmark,
  EllipsisVertical,
} from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const { db, loading: dbLoading } = useDB();
  const { balance } = useBalance();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!db) return;

    (async () => {
      const allTxs = await db.getAll("transactions");
      // Sort by date descending, limit to 5
      setTransactions(
        allTxs
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
      );
    })();
  }, [db]);

  if (dbLoading) return <div className="p-8">Loading...</div>;

  const formatStatus = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <CheckCircle2 size={12} /> Settled
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
            <Clock size={12} /> Processing
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Assets & Accounts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Total Assets Hero */}
          <div>
            <h2 className="text-3xl font-normal text-gray-800 mb-1">
              Your total assets are{" "}
              <span className="font-bold">
                {formatCurrency(balance + 11_005_131.86, "USD")}
              </span>
            </h2>
            <p className="text-green-600 text-sm font-medium mb-6">
              + 12,990 interest last 30 days
            </p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-gray-300 w-[75%]"></div>
              <div className="h-full bg-gray-600 w-[25%]"></div>
            </div>
          </div>

          {/* Accounts List */}
          <div className="space-y-4">
            {/* Business Account (Active) */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-600">
                  <Wallet size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">
                      Business Account
                    </h3>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                      Earning 2.5%
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-gray-900">
                  {formatCurrency(balance, "USD")}
                </p>
                <p className="text-green-600 text-xs">
                  + 12,990 interest last 30 days
                </p>
              </div>
            </div>

            {/* Investment Account (Static Mock) */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-600 rounded flex items-center justify-center text-white">
                  <Landmark size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">
                      Investment Account
                    </h3>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                      Earning 4.5%
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 border-0"
              >
                <ArrowDownLeft
                  size={16}
                  className="mr-2"
                />
                Add or Transfer Funds
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: News Widget */}
        <div className="lg:col-span-1">
          <Card className="h-full border-gray-100 shadow-sm">
            <CardContent className=" flex flex-col h-full">
              <div className="mb-4 text-yellow-400">
                <Sparkles
                  size={24}
                  fill="currentColor"
                />
              </div>
              <h3 className="font-bold text-lg mb-3 leading-tight">
                Budget deal averts shutdown, easing political gridlock
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed ">
                After days of tense negotiations, lawmakers reached a
                last-minute agreement to extend government funding and keep
                agencies open while a longer-term budget is debated. The
                compromise cools partisan friction for now, with leaders
                pledging to resume talks on spending caps and deficit measures.
                Markets reacted with cautious relief as policy uncertainty
                briefly receded.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div>
        <h3 className="text-xl font-normal text-gray-800 mb-6">
          Recent Transactions
        </h3>
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Counterparty</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400 text-sm"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isInflow =
                    tx.type === "deposit" || tx.type === "payment_received";
                  const amountClass = isInflow
                    ? "text-green-600"
                    : "text-red-500";

                  // Use transaction currency, defaulting to USD if undefined
                  const currency = tx.currency || "USD";

                  return (
                    <tr
                      key={tx.id}
                      className="bg-white hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-2">
                          {isInflow ? (
                            <ArrowDownLeft
                              size={16}
                              className="text-green-600"
                            />
                          ) : (
                            <ArrowUpRight
                              size={16}
                              className="text-red-500"
                            />
                          )}
                          <span className="capitalize">
                            {tx.type.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {typeof tx.metadata === "object" &&
                        "recipientEmail" in (tx.metadata ?? {})
                          ? (tx.metadata as any).recipientEmail
                          : tx.fromCompanyId === "company-1"
                          ? "ACME Corp"
                          : "External"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{formatStatus(tx.status)}</td>
                      <td
                        className={`px-6 py-4 text-right font-medium ${amountClass}`}
                      >
                        <div>
                          {isInflow ? "+" : "-"}
                          {formatCurrency(tx.amount, currency)}
                        </div>
                        {currency !== "USD" && tx.exchangeRate && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            ≈{" "}
                            {formatCurrency(tx.amount * tx.exchangeRate, "USD")}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="More options"
                        >
                          <EllipsisVertical size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="pt-4">
          <Link
            href="/transactions"
            className="text-sm font-medium text-gray-900 flex items-center gap-1 hover:underline"
          >
            See all transactions <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* BOTTOM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vero Card Promo */}
        <Card className="grid p-0 grid-cols-2 gap-4 items-center overflow-hidden relative group">
          <div className="p-6 relative z-10">
            <CardTitle className="text-lg mb-2">
              Create your Vero Card
            </CardTitle>
            <CardDescription className="mb-6">
              Order Physical cards with expedited shipping or create unlimited
              virtual cards in seconds
            </CardDescription>
            <Link
              href="#"
              className="text-primary underline-offset-4 hover:underline font-medium text-sm"
            >
              Let me know
            </Link>
          </div>
          {/* Mock Card Visual */}
          <div className="flex items-end justify-end h-full w-full">
            <Image
              src="/card.png"
              width={400}
              height={250}
              alt="Bento promo card"
              className="w-full h-auto object-cover"
              style={{ objectPosition: "right bottom" }}
            />
          </div>
        </Card>

        {/* Verified Business Promo */}
        <Card className="grid p-0 grid-cols-[1fr_auto] gap-4 items-center overflow-hidden relative group">
          <div className="p-6 relative z-10 w-full">
            <CardTitle className="text-lg mb-2 w-full">
              Be recognized as a Verified Business
            </CardTitle>
            <CardDescription className="mb-6 w-full">
              Verify once to speed up withdrawals and display your Verified
              status to partners.
            </CardDescription>
            <Link
              href="#"
              className="text-primary underline-offset-4 hover:underline font-medium text-sm w-full inline-block"
            >
              Verify My Business
            </Link>
          </div>
          {/* Larger centred security image */}
          <div className="flex items-center justify-center ">
            <Image
              src="/security.png"
              width={180}
              height={180}
              alt="Security verified"
              className="object-contain"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
