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
  Shuffle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

  // Type term labeling logic
  function getTypeDisplay(tx: Transaction) {
    // The image clearly indicates "Outflow", "Inflow", "Transfer"
    // "deposit" and "payment_received" are Inflow
    // "withdrawal" and "payment_sent" are Outflow
    // Other types (e.g., "transfer") are Transfer (if we implement them in types)
    if (tx.type === "deposit" || tx.type === "payment_received") {
      return {
        label: "Inflow",
        icon: (
          <ArrowDownLeft
            size={16}
            className="text-green-600"
          />
        ),
        className: "text-green-600",
      };
    } else if (tx.type === "withdrawal" || tx.type === "payment_sent") {
      return {
        label: "Outflow",
        icon: (
          <ArrowUpRight
            size={16}
            className="text-red-500"
          />
        ),
        className: "text-red-500",
      };
    } else if (tx.type === "transfer") {
      // If added as a possible type, show transfer styling
      return {
        label: "Transfer",
        icon: (
          <Shuffle
            size={16}
            className="text-gray-300"
          />
        ),
        className: "text-gray-400",
        transfer: true,
      };
    } else {
      // fallback for unknown type
      return {
        label:
          tx.type && typeof tx.type === "string"
            ? (tx.type as string).split("_").join(" ")
            : "Unknown",
        icon: null,
        className: "",
      };
    }
  }

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
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const {
                  label,
                  icon,
                  className,
                  transfer = false,
                }: {
                  label: string;
                  icon: React.ReactNode;
                  className: string;
                  transfer?: boolean;
                } = getTypeDisplay(tx) as {
                  label: string;
                  icon: React.ReactNode;
                  className: string;
                  transfer?: boolean;
                };
                const isInflow = label === "Inflow";
                const isOutflow = label === "Outflow";

                // Use transaction currency, defaulting to USD
                const currency = tx.currency || "USD";
                // Make text gray for "Transfer"
                const rowTypeClass = transfer ? "opacity-60" : "";

                return (
                  <TableRow
                    key={tx.id}
                    className={`text-sm ${rowTypeClass}`}
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      {icon}
                      <span className={transfer ? "text-gray-500" : ""}>
                        {label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(typeof tx.metadata === "object" &&
                        tx.metadata !== null &&
                        "recipientEmail" in tx.metadata &&
                        (tx.metadata &&
                        typeof tx.metadata === "object" &&
                        "recipientEmail" in tx.metadata
                          ? (tx.metadata as any).recipientEmail
                          : undefined)) ||
                        (tx.fromCompanyId === "company-1"
                          ? "ACME Corp"
                          : "External")}
                    </TableCell>
                    <TableCell>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{formatStatus(tx.status)}</TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        isInflow
                          ? "text-green-600"
                          : isOutflow
                          ? "text-red-500"
                          : transfer
                          ? "text-gray-400"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col items-end">
                        <span>
                          {isInflow ? "+" : isOutflow ? "-" : ""}
                          {formatCurrency(tx.amount, currency)}
                        </span>
                        {currency !== "USD" && tx.exchangeRate && (
                          <span className="text-xs text-gray-400 font-normal">
                            ≈{" "}
                            {formatCurrency(tx.amount * tx.exchangeRate, "USD")}
                          </span>
                        )}
                      </div>
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
