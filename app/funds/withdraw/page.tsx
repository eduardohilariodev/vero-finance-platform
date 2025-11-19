"use client";
import { useState } from "react";
import { useDB } from "@/hooks/useDB";
import { useBalance } from "@/hooks/useBalance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { v4 as uuid } from "uuid";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";
import Link from "next/link";

export default function WithdrawFundsPage() {
  const { db } = useDB();
  const { balance } = useBalance();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Validate Balance and Move to OTP
  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (val > balance) {
      setError("Insufficient funds");
      return;
    }

    if (!address || address.length < 10) {
      setError("Please enter a valid wallet address");
      return;
    }

    setStep("otp");
  };

  // Step 2: Verify OTP and Create Transaction
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (otp !== "123456") {
      setError("Invalid OTP code (Hint: use 123456)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await db.add("transactions", {
        id: uuid(),
        type: "withdrawal",
        amount: parseFloat(amount),
        currency: "USDC",
        fromCompanyId: CURRENT_COMPANY_ID,
        // No toCompanyId for external withdrawal in this schema,
        // or we could use 'external'
        status: "pending", // Withdrawals often require approval
        createdAt: new Date(),
        metadata: {
          description: `Withdrawal to ${address.substring(0, 6)}...`,
          networkFee: 5, // Simulate a gas fee
          destinationAddress: address,
        },
      });

      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Withdrawal failed");
      } else {
        setError("Withdrawal failed");
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
            <div className="text-5xl mb-2">🔒</div>
            <h2 className="text-xl font-bold text-gray-800">
              Withdrawal Initiated
            </h2>
            <p className="text-gray-500">
              Your request to withdraw ${amount} USDC has been submitted for
              processing.
            </p>
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-sm">
              Status: Pending Approval
            </div>
            <div className="pt-4">
              <Link href="/dashboard">
                <Button className="w-full">Return to Dashboard</Button>
              </Link>
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
          <CardTitle>Withdraw Funds</CardTitle>
          <p className="text-sm text-gray-500">
            Available Balance: ${balance.toLocaleString()} USDC
          </p>
        </CardHeader>
        <CardContent>
          {step === "form" ? (
            <form
              onSubmit={handleInitiate}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount (USDC)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Destination Wallet Address
                </label>
                <Input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button
                type="submit"
                className="w-full"
              >
                Next
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
          ) : (
            <form
              onSubmit={handleConfirm}
              className="space-y-6"
            >
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">Confirm Withdrawal</p>
                <p className="text-2xl font-bold">${amount} USDC</p>
                <p className="text-xs text-gray-400 mt-1">To: {address}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter OTP Code
                </label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center tracking-widest text-lg"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">
                  (Mock: Enter &quot;123456&quot;)
                </p>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("form")}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Confirm"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
