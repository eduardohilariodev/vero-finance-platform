// app/requests/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useDB } from "@/hooks/useDB";
import { PaymentRequest } from "@/lib/types";
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
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, User, Landmark } from "lucide-react";
import Link from "next/link";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";

export default function RequestsPage() {
  const { db, loading: dbLoading } = useDB();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);

  useEffect(() => {
    if (!db) return;
    (async () => {
      const allReqs = await db.getAll("paymentRequests");
      setRequests(
        allReqs.sort(
          (a, b) =>
            new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        )
      );
    })();
  }, [db]);

  if (dbLoading) return <div className="p-8">Loading requests...</div>;

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);

  const formatStatus = (status: string) => {
    switch (status) {
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
      case "accepted":
        return (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
          >
            <CheckCircle2
              size={14}
              className="mr-1"
            />{" "}
            Accepted
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const incomingRequests = requests.filter(
    (req) => req.toCompanyId === CURRENT_COMPANY_ID
  );
  const outgoingRequests = requests.filter(
    (req) => req.fromCompanyId === CURRENT_COMPANY_ID
  );

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
      <h1 className="text-3xl font-bold">Payment Requests</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User size={20} /> Incoming Requests ({incomingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="uppercase text-xs text-gray-500">
                <TableHead>From</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomingRequests.map((req) => (
                <TableRow
                  key={req.id}
                  className="text-sm"
                >
                  <TableCell className="font-medium">
                    {req.fromCompanyId === "company-2"
                      ? "ACME Corp"
                      : "External Partner"}
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    {formatCurrency(req.amount, req.currency)}
                  </TableCell>
                  <TableCell>
                    {new Date(req.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{formatStatus(req.status)}</TableCell>
                  <TableCell>
                    {req.status === "pending" ? (
                      <Link href={`/payments/accept?requestId=${req.id}`}>
                        <Button
                          size="sm"
                          variant="default"
                        >
                          Review & Accept
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                      >
                        View Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {incomingRequests.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 py-6"
                  >
                    No pending incoming requests.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Landmark size={20} /> Outgoing Requests ({outgoingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="uppercase text-xs text-gray-500">
                <TableHead>To</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outgoingRequests.map((req) => (
                <TableRow
                  key={req.id}
                  className="text-sm"
                >
                  <TableCell className="font-medium">
                    {req.toCompanyId === "company-2"
                      ? "ACME Corp"
                      : "External Partner"}
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    {formatCurrency(req.amount, req.currency)}
                  </TableCell>
                  <TableCell>
                    {new Date(req.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{formatStatus(req.status)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={req.status !== "pending"}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {outgoingRequests.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 py-6"
                  >
                    No outgoing requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
