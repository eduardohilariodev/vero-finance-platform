"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDB } from "@/hooks/useDB";
import { useBalance } from "@/hooks/useBalance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentRequest } from "@/lib/types";
import { v4 as uuid } from "uuid";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";

function AcceptPaymentContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const router = useRouter();
  const { db } = useDB();
  const { balance } = useBalance();

  // FIX: Explicitly type the state so TypeScript knows what 'request' contains
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load the request details
  useEffect(() => {
    if (!db || !requestId) return;

    (async () => {
      try {
        const req = await db.get("paymentRequests", requestId);
        if (req) {
          setRequest(req);
        } else {
          setError("Request not found");
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load request");
        } else {
          setError("Failed to load request");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [db, requestId]);

  const handleAccept = async () => {
    if (!db || !request) return;

    setProcessing(true);
    setError("");

    try {
      // Validation
      if (request.amount > balance) {
        throw new Error("Insufficient funds");
      }

      if (request.status === "paid") {
        throw new Error("This request has already been paid");
      }

      // 1. Create outgoing transaction (Me -> Requester)
      await db.add("transactions", {
        id: uuid(),
        type: "payment_sent",
        amount: request.amount,
        currency: request.currency,
        fromCompanyId: CURRENT_COMPANY_ID,
        toCompanyId: request.fromCompanyId, // The person who requested the money
        status: "completed",
        createdAt: new Date(),
        metadata: {
          requestId: request.id,
          description: "Payment Request Accepted",
        },
      });

      // 2. Create incoming transaction for the requester (simulated)
      await db.add("transactions", {
        id: uuid(),
        type: "payment_received",
        amount: request.amount,
        currency: request.currency,
        fromCompanyId: CURRENT_COMPANY_ID,
        toCompanyId: request.fromCompanyId,
        status: "completed",
        createdAt: new Date(),
        metadata: { requestId: request.id },
      });

      // 3. Update request status to paid
      await db.put("paymentRequests", {
        ...request,
        status: "paid",
      });

      setSuccess(true);

      // Redirect after short delay
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Payment failed");
      } else {
        setError("Payment failed");
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8">Loading request details...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!request) return <div className="p-8">Request not found</div>;

  if (success) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xl font-bold text-green-600 mb-4">
              ✓ Payment Accepted & Sent!
            </p>
            <p className="text-gray-500">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Accept Payment Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Due</span>
              <span className="text-xl font-bold">
                ${request.amount} {request.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Requested By (ID)</span>
              <span className="font-medium text-sm">
                {request.fromCompanyId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Due Date</span>
              <span className="font-medium">
                {new Date(request.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-4">
              <span className="text-gray-500">Your Balance</span>
              <span className="font-medium">${balance.toLocaleString()}</span>
            </div>
            {request.amount > balance && (
              <p className="text-red-500 text-sm mb-4">
                Insufficient funds to pay this request.
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={
                processing ||
                request.amount > balance ||
                request.status === "paid"
              }
            >
              {processing ? "Processing..." : "Pay Now"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptPaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptPaymentContent />
    </Suspense>
  );
}
