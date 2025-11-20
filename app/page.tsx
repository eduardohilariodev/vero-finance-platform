"use client";
import { useEffect, useState } from "react";
import { useDB } from "@/hooks/useDB";
import { useBalance } from "@/hooks/useBalance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Transaction } from "@/lib/types";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Wallet,
  Building2,
  Sparkles,
  MoreVertical,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";

export default function Dashboard() {
  const { db, loading: dbLoading } = useDB();
  const { balance } = useBalance();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!db) return;

    (async () => {
      const allTxs = await db.getAll("transactions");
      setTransactions(
        allTxs
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
      );
    })();
  }, [db]);

  if (dbLoading) return <div className="p-8">Loading...</div>;

  // Helper to format currency roughly like the screenshot
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
    })
      .format(amount)
      .replace("US$", "$");
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
                {formatCurrency(balance + 11005131.86)}
              </span>
            </h2>
            <p className="text-green-600 text-sm font-medium mb-6">
              + 12.990 interest last 30 days
            </p>

            {/* Progress Bar Mock */}
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
                  {formatCurrency(balance)}
                </p>
                <p className="text-green-600 text-xs">
                  + 12.990 interest last 30 days
                </p>
              </div>
            </div>

            {/* Investment Account (Static Mock) */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-600 rounded flex items-center justify-center text-white">
                  <Building2 size={20} />
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
            <CardContent className="p-6 flex flex-col h-full">
              <div className="mb-4 text-yellow-400">
                <Sparkles
                  size={24}
                  fill="currentColor"
                />
              </div>
              <h3 className="font-bold text-lg mb-3 leading-tight">
                Budget deal averts shutdown, easing political gridlock
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                After days of tense negotiations, lawmakers reached a
                last-minute agreement to extend government funding and keep
                agencies open while a longer-term budget is debated.
              </p>
              <div className="mt-auto pt-4">
                {/* Spacer to push content up if needed */}
              </div>
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
              {transactions.map((tx) => {
                const isInflow =
                  tx.toCompanyId === CURRENT_COMPANY_ID ||
                  tx.type === "deposit";
                const isInternal =
                  tx.fromCompanyId === CURRENT_COMPANY_ID &&
                  tx.toCompanyId === CURRENT_COMPANY_ID; // mock logic

                return (
                  <tr
                    key={tx.id}
                    className="bg-white hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {isInflow ? (
                          <ArrowDownLeft
                            className="text-green-600"
                            size={18}
                          />
                        ) : (
                          <ArrowUpRight
                            className="text-red-500"
                            size={18}
                          />
                        )}
                        <span className="font-medium text-gray-900 capitalize">
                          {tx.type === "payment_received"
                            ? "Inflow"
                            : tx.type === "payment_sent"
                            ? "Outflow"
                            : tx.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {isInflow ? "ACME Corp" : "marcoswbd@gmail.com"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === "completed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <CheckCircle2 size={12} /> Settled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                          <Clock size={12} /> Processing
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-medium ${
                        isInflow ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {isInflow ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {/* Manual Mock Row for Transfer if list is empty or just to match design */}
              <tr className="bg-white hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft
                      className="text-gray-400"
                      size={18}
                    />
                    <span className="font-medium text-gray-900">Transfer</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">Business Account</td>
                <td className="px-6 py-4 text-gray-600 font-medium">
                  12 Oct 2024
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <Clock size={12} /> Processing
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">
                  R$ 124,024.92
                </td>
                <td className="px-6 py-4 text-right">
                  <Button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </Button>
                </td>
              </tr>
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
        <div className="border border-gray-200 rounded-xl p-8 flex justify-between items-center bg-white overflow-hidden relative group">
          <div className="relative z-10 max-w-[60%]">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Create your Vero Card
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Order Physical cards with expedited shipping or create unlimited
              virtual cards in seconds
            </p>
            <Button className="text-sm font-semibold text-gray-900 hover:underline">
              Let me know
            </Button>
          </div>
          {/* Mock Card Visual */}
          <div className="absolute right-[-20px] bottom-[-40px] w-48 h-32 bg-gradient-to-br from-gray-300 to-gray-500 rounded-lg shadow-xl transform -rotate-12 group-hover:-rotate-6 transition-transform duration-300 flex items-center justify-center text-white/20 font-bold text-2xl border-t border-white/40">
            vero
          </div>
        </div>

        {/* Verified Business Promo */}
        <div className="border border-gray-200 rounded-xl p-8 flex justify-between items-center bg-white overflow-hidden relative">
          <div className="relative z-10 max-w-[60%]">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Be recognized as a Verified Business
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Verify once to speed up withdrawals and display your Verified
              status to partners.
            </p>
            <Button className="text-sm font-semibold text-gray-900 hover:underline">
              Verify My Business
            </Button>
          </div>
          {/* Mock Shield Visual */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="w-20 h-24 bg-gradient-to-b from-yellow-200 to-yellow-500 rounded-b-[40px] rounded-t-[10px] shadow-lg flex items-center justify-center">
              <CheckCircle2 className="text-white w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
