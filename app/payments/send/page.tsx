"use client";
import { useState } from "react";
import { useDB } from "@/hooks/useDB";
import { useBalance } from "@/hooks/useBalance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { v4 as uuid } from "uuid";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";

export default function SendPaymentPage() {
  const { db } = useDB();
  const { balance } = useBalance();
  const [formData, setFormData] = useState({
    amount: "",
    companyName: "",
    email: "",
    dueDate: new Date().toISOString().split("T")[0],
    currency: "USDC",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setLoading(true);
    setError("");

    try {
      const amount = parseFloat(formData.amount);

      // Validation
      if (amount <= 0) throw new Error("Amount must be positive");
      if (!formData.email) throw new Error("Email is required");

      // Find or create recipient company
      let recipientCompany = await db.getFromIndex(
        "companies",
        "email",
        formData.email
      );
      if (!recipientCompany) {
        recipientCompany = {
          id: uuid(),
          name: formData.companyName || "New Company",
          email: formData.email,
        };
        await db.add("companies", recipientCompany);
      }

      const dueDate = new Date(formData.dueDate);
      const isToday = new Date().toDateString() === dueDate.toDateString();

      // Check if scheduled or immediate
      if (isToday && amount <= balance) {
        // Send immediately
        const txId = uuid();
        await db.add("transactions", {
          id: txId,
          type: "payment_sent",
          amount,
          currency: formData.currency,
          fromCompanyId: CURRENT_COMPANY_ID,
          toCompanyId: recipientCompany.id,
          status: "completed",
          createdAt: new Date(),
          metadata: { description: "Payment" },
        });

        // Add corresponding received transaction for recipient
        await db.add("transactions", {
          id: uuid(),
          type: "payment_received",
          amount,
          currency: formData.currency,
          fromCompanyId: CURRENT_COMPANY_ID,
          toCompanyId: recipientCompany.id,
          status: "completed",
          createdAt: new Date(),
        });

        setSuccess(true);
      } else if (!isToday) {
        // Schedule for later
        const txId = uuid();
        await db.add("transactions", {
          id: txId,
          type: "payment_sent",
          amount,
          currency: formData.currency,
          fromCompanyId: CURRENT_COMPANY_ID,
          toCompanyId: recipientCompany.id,
          status: "pending",
          scheduledFor: dueDate,
          createdAt: new Date(),
        });
        setSuccess(true);
      } else {
        throw new Error("Insufficient balance for immediate payment");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xl font-bold text-green-600 mb-4">
              ✓ Payment sent successfully!
            </p>
            <Button onClick={() => setSuccess(false)}>Send another</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Send Payment</CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Current balance: ${balance.toLocaleString()}
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <Input
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label
                htmlFor="currency-select"
                className="block text-sm font-medium mb-2"
              >
                Currency
              </label>
              <select
                id="currency-select"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option>USDC</option>
                <option>USD</option>
                <option>ETH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Recipient Email
              </label>
              <Input
                type="email"
                placeholder="partner@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Recipient Company Name
              </label>
              <Input
                type="text"
                placeholder="Partner Inc"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Processing..." : "Send Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
