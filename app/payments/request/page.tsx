"use client";
import { useState } from "react";
import { useDB } from "@/hooks/useDB";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { v4 as uuid } from "uuid";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";

export default function RequestPaymentPage() {
  const { db } = useDB();
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

      // Find or create the company we are requesting money FROM
      let targetCompany = await db.getFromIndex(
        "companies",
        "email",
        formData.email
      );

      if (!targetCompany) {
        targetCompany = {
          id: uuid(),
          name: formData.companyName || "New Company",
          email: formData.email,
        };
        await db.add("companies", targetCompany);
      }

      // Create Payment Request
      await db.add("paymentRequests", {
        id: uuid(),
        fromCompanyId: CURRENT_COMPANY_ID, // Me (Requester)
        toCompanyId: targetCompany.id, // Them (Payer)
        amount,
        currency: formData.currency,
        dueDate: new Date(formData.dueDate),
        status: "pending",
        createdAt: new Date(),
      });

      setSuccess(true);
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
              ✓ Payment request sent successfully!
            </p>
            <Button onClick={() => setSuccess(false)}>Request another</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Request Payment</CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Request funds from another company
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
                Payer Email
              </label>
              <Input
                type="email"
                placeholder="client@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Payer Company Name
              </label>
              <Input
                type="text"
                placeholder="Client Corp"
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
              {loading ? "Processing..." : "Request Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
