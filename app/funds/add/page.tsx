"use client";
import { useState } from "react";
import { useDB } from "@/hooks/useDB";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { v4 as uuid } from "uuid";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";
import Link from "next/link";

export default function AddFundsPage() {
  const { db } = useDB();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setLoading(true);
    setError("");

    try {
      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) {
        throw new Error("Please enter a valid positive amount");
      }

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Create the deposit transaction
      await db.add("transactions", {
        id: uuid(),
        type: "deposit",
        amount: val,
        currency: "USDC",
        fromCompanyId: "external", // External bank/card
        toCompanyId: CURRENT_COMPANY_ID,
        status: "completed", // Instant deposit for demo
        createdAt: new Date(),
        metadata: {
          description: "Bank Transfer Deposit",
        },
      });

      // Update wallet balance (optional, though useBalance hook derives it from txs usually)
      // We just ensure the wallet entry exists
      const wallet = await db.get("wallets", CURRENT_COMPANY_ID);
      if (!wallet) {
        await db.add("wallets", {
          companyId: CURRENT_COMPANY_ID,
          balance: 0,
          currency: "USDC",
          lastUpdated: new Date(),
        });
      }

      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to add funds");
      } else {
        setError("Failed to add funds");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-xl font-bold text-green-600">
              Funds Added Successfully!
            </h2>
            <p className="text-gray-500">
              Your account has been credited with ${amount} USDC.
            </p>
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/dashboard">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setAmount("");
                }}
              >
                Add More Funds
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 mb-4">
              Simulate a deposit from an external bank account.
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Amount (USDC)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="5000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !amount}
            >
              {loading ? "Processing Deposit..." : "Deposit Funds"}
            </Button>

            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="w-full mt-2"
              >
                Cancel
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
