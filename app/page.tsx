"use client";
import { useEffect, useState } from "react";
import { useDB } from "@/hooks/useDB";
import { useBalance } from "@/hooks/useBalance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
// 1. Import the types
import { Transaction, PaymentRequest } from "@/lib/types";

export default function Dashboard() {
  const { db, loading: dbLoading } = useDB();
  const { balance } = useBalance();

  // 2. Add generics to useState so TypeScript knows what these arrays contain
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PaymentRequest[]>([]);

  useEffect(() => {
    if (!db) return;

    (async () => {
      // Last 5 transactions
      const allTxs = await db.getAll("transactions");
      setTransactions(
        allTxs
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
      );

      // Pending requests received
      const allReqs = await db.getAll("paymentRequests");
      setPendingRequests(
        allReqs.filter(
          (r) => r.status === "pending" && r.toCompanyId === "company-1"
        )
      );
    })();
  }, [db]);

  if (dbLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 p-8">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
        </CardHeader>
        <CardContent className="text-4xl font-bold">
          ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link href="/payments/send">
          <Button className="w-full">Send Payment</Button>
        </Link>
        <Link href="/payments/request">
          <Button
            variant="outline"
            className="w-full"
          >
            Request Payment
          </Button>
        </Link>
        <Link href="/funds/add">
          <Button
            variant="outline"
            className="w-full"
          >
            Add Funds
          </Button>
        </Link>
        <Link href="/funds/withdraw">
          <Button
            variant="outline"
            className="w-full"
          >
            Withdraw
          </Button>
        </Link>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Pending Payment Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <p className="font-semibold">
                      ${req.amount} {req.currency}
                    </p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(req.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/payments/accept?requestId=${req.id}`}>
                    <Button size="sm">Accept</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="capitalize font-medium">
                    {tx.type.replace("_", " ")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p
                  className={
                    tx.type.includes("sent") || tx.type === "withdrawal"
                      ? "text-red-500"
                      : "text-green-500"
                  }
                >
                  {tx.type.includes("sent") || tx.type === "withdrawal"
                    ? "-"
                    : "+"}
                  ${tx.amount}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
