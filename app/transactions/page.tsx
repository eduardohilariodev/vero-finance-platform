// app/transactions/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useDB } from "@/hooks/useDB";
import { Transaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function TransactionsPage() {
  const { db, loading: dbLoading } = useDB();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!db) return;
    (async () => {
      const allTxs = await db.getAll("transactions");
      // Sort by date descending
      setTransactions(
        allTxs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      );
    })();
  }, [db]);

  if (dbLoading) return <div className="p-8">Loading transactions...</div>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
          >
            <CheckCircle2
              size={14}
              className="mr-1"
            />{" "}
            Settled
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50"
          >
            <Clock
              size={14}
              className="mr-1"
            />{" "}
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
      <h1 className="text-3xl font-bold">Transaction History</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="uppercase text-xs text-gray-500">
                <TableHead>Type</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const isInflow =
                  tx.type === "deposit" || tx.type === "payment_received";
                // Removed isTransfer, since "transfer" is not a Transaction type
                const amountClass = isInflow
                  ? "text-green-600"
                  : "text-red-500";

                return (
                  <TableRow
                    key={tx.id}
                    className="text-sm"
                  >
                    <TableCell className="font-medium flex items-center gap-2">
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
                      {tx.type.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      {tx.fromCompanyId === "company-1"
                        ? "ACME Corp"
                        : "External"}
                    </TableCell>
                    <TableCell>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{formatStatus(tx.status)}</TableCell>
                    <TableCell
                      className={`text-right font-semibold ${amountClass}`}
                    >
                      {isInflow ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <MoreHorizontal
                        size={16}
                        className="text-gray-400 cursor-pointer"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
