"use client";
import { useState, useMemo } from "react";
import { useDB } from "@/hooks/useDB";
import { useBalance } from "@/hooks/useBalance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { v4 as uuid } from "uuid";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";
import Link from "next/link";

// --- Constants for Mock Data ---
const NETWORKS = [
  { id: "ETH", name: "Ethereum (ERC-20)", fee: 15 },
  { id: "POL", name: "Polygon", fee: 0.1 },
  { id: "SOL", name: "Solana", fee: 0.05 },
];

const FIAT_CURRENCIES = [
  { id: "USD", name: "US Dollar (USD)", fee: 25 },
  { id: "EUR", name: "Euro (EUR)", fee: 20 },
  { id: "GBP", name: "British Pound (GBP)", fee: 20 },
];

type WithdrawMethod = "crypto" | "bank";

export default function WithdrawFundsPage() {
  const { db } = useDB();
  const { balance } = useBalance();

  // Flow State
  const [step, setStep] = useState<"form" | "otp">("form");
  const [method, setMethod] = useState<WithdrawMethod>("crypto");

  // Form State
  const [amount, setAmount] = useState("");
  const [otp, setOtp] = useState("");

  // Crypto Specific
  const [address, setAddress] = useState("");
  const [networkId, setNetworkId] = useState("ETH");

  // Bank Specific
  const [fiatId, setFiatId] = useState("USD");
  const [bankAccount, setBankAccount] = useState("");

  // Request State
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // --- Computed Values (Fees) ---
  const selectedNetwork = NETWORKS.find((n) => n.id === networkId);
  const selectedFiat = FIAT_CURRENCIES.find((f) => f.id === fiatId);

  const fees = useMemo(() => {
    // Mock Logic: Platform fee is fixed, Network fee varies
    const platformFee = 2.0; // Base offramp fee

    if (method === "crypto") {
      const gasFee = selectedNetwork?.fee || 0;
      return {
        network: gasFee,
        offramp: platformFee,
        total: gasFee + platformFee,
      };
    } else {
      const wireFee = selectedFiat?.fee || 0;
      return {
        network: 0, // No gas for bank
        offramp: wireFee, // Wire transfer fee
        total: wireFee,
      };
    }
  }, [method, selectedNetwork, selectedFiat]);

  // Step 1: Validate inputs based on path
  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    // Check Total Cost (Amount + Fees) vs Balance
    if (val + fees.total > balance) {
      setError(
        `Insufficient funds to cover amount + fees ($${fees.total.toFixed(2)})`
      );
      return;
    }

    // Method Specific Validation
    if (method === "crypto") {
      if (!address || address.length < 10) {
        setError("Please enter a valid wallet address");
        return;
      }
    } else {
      if (!bankAccount || bankAccount.length < 5) {
        setError("Please enter a valid account number / IBAN");
        return;
      }
    }

    setStep("otp");
  };

  // Step 2: Confirm & Execute
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

      const finalAmount = parseFloat(amount);

      // Construct Metadata based on method
      const metadata =
        method === "crypto"
          ? {
              description: `Withdrawal to ${selectedNetwork?.name}`,
              destinationAddress: address,
              network: selectedNetwork?.name,
              networkFee: fees.network,
              offrampFee: fees.offramp,
            }
          : {
              description: `Wire Transfer to ${selectedFiat?.id} Account`,
              destinationAccount: bankAccount,
              currency: selectedFiat?.id,
              offrampFee: fees.offramp,
            };

      await db.add("transactions", {
        id: uuid(),
        type: "withdrawal",
        amount: finalAmount,
        currency: "USDC", // Underlying asset removed is USDC
        fromCompanyId: CURRENT_COMPANY_ID,
        status: "pending",
        createdAt: new Date(),
        metadata: metadata,
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Withdrawal failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success View
  if (success) {
    return (
      <div className="max-w-md mx-auto p-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-5xl mb-2">🚀</div>
            <h2 className="text-xl font-bold text-gray-800">
              Withdrawal Initiated
            </h2>
            <p className="text-gray-500">
              Your {method === "crypto" ? "crypto transfer" : "bank wire"} for
              <span className="font-bold text-gray-700"> ${amount} </span>
              has been submitted.
            </p>
            <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm text-left space-y-1">
              <p>
                <strong>Method:</strong>{" "}
                {method === "crypto"
                  ? selectedNetwork?.name
                  : `Bank Transfer (${selectedFiat?.id})`}
              </p>
              <p>
                <strong>Fees Paid:</strong> ${fees.total.toFixed(2)}
              </p>
              <p>
                <strong>Status:</strong> Processing
              </p>
            </div>
            <div className="pt-4">
              <Link href="">
                <Button className="w-full">Return to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Form View
  return (
    <div className="max-w-lg mx-auto p-6">
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
              {/* Method Selection */}
              <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMethod("crypto")}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${
                    method === "crypto"
                      ? "bg-white text-black shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Cryptocurrency
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("bank")}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${
                    method === "bank"
                      ? "bg-white text-black shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Bank Transfer
                </button>
              </div>

              {/* Amount Input (Common) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount to Withdraw (USDC)
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

              {/* --- CRYPTO PATH --- */}
              {method === "crypto" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Network
                    </label>
                    <select
                      className="w-full p-2 border rounded-md bg-white"
                      value={networkId}
                      onChange={(e) => setNetworkId(e.target.value)}
                    >
                      {NETWORKS.map((n) => (
                        <option
                          key={n.id}
                          value={n.id}
                        >
                          {n.name} (Gas: ~${n.fee})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Destination Address
                    </label>
                    <Input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={`Enter ${networkId} address`}
                      required
                    />
                  </div>
                </div>
              )}

              {/* --- BANK PATH --- */}
              {method === "bank" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Fiat Currency
                    </label>
                    <select
                      className="w-full p-2 border rounded-md bg-white"
                      value={fiatId}
                      onChange={(e) => setFiatId(e.target.value)}
                    >
                      {FIAT_CURRENCIES.map((f) => (
                        <option
                          key={f.id}
                          value={f.id}
                        >
                          {f.name} (Fee: ${f.fee})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      IBAN / Account Number
                    </label>
                    <Input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Enter account details"
                      required
                    />
                  </div>
                </div>
              )}

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button
                type="submit"
                className="w-full"
              >
                Continue
              </Button>

              <Link href="">
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                >
                  Cancel
                </Button>
              </Link>
            </form>
          ) : (
            // --- CONFIRMATION / OTP STEP ---
            <form
              onSubmit={handleConfirm}
              className="space-y-6"
            >
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="text-center pb-3 border-b border-gray-200">
                  <p className="text-sm text-gray-500">Total Withdrawal</p>
                  <p className="text-3xl font-bold">
                    ${parseFloat(amount).toLocaleString()}
                  </p>
                </div>

                {/* Dynamic Fee Breakdown based on flowchart requirements */}
                <div className="text-sm space-y-2 pt-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Destination:</span>
                    <span className="font-medium truncate max-w-[150px]">
                      {method === "crypto" ? address : bankAccount}
                    </span>
                  </div>

                  {method === "crypto" ? (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Network Gas:</span>
                        <span>${fees.network.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Offramp Fee:</span>
                        <span>${fees.offramp.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-gray-600">
                      <span>Bank Wire Fee:</span>
                      <span>${fees.offramp.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-800">
                    <span>Total Fees:</span>
                    <span>${fees.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-center">
                  Enter OTP Code sent to email
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
                <p className="text-xs text-gray-400 mt-2 text-center">
                  (Mock: Enter "123456")
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
                  {loading ? "Processing..." : "Confirm Withdraw"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
