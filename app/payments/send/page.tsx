"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDB } from "@/hooks/useDB";
import { useBalance } from "@/hooks/useBalance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User, ChevronDown, Plus, X, Wallet } from "lucide-react";
import { v4 as uuid } from "uuid";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";
import { Company } from "@/lib/types";
import { getExchangeRate } from "@/lib/currency";

const CURRENCIES = ["USD", "USDC", "EUR", "ETH"];
type Step = "form" | "review" | "success";

export default function SendPaymentPage() {
  const { db } = useDB();
  const { balance } = useBalance();
  const router = useRouter();

  // Refs for click-outside detection
  const wrapperRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("form");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // Main Form State
  const [formData, setFormData] = useState({
    amount: "",
    email: "",
    description: "",
    dueDate: "",
    currency: "USD",
  });

  // Exchange Rate State
  const [currentRate, setCurrentRate] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(0);

  // Create Company Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    name: "",
    email: "",
    walletAddress: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch available companies
  const fetchCompanies = async () => {
    if (db) {
      const all = await db.getAll("companies");
      setCompanies(all.filter((c) => c.id !== CURRENT_COMPANY_ID));
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [db]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setShowSuggestions(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(target)) {
        setShowCurrencyDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(formData.email.toLowerCase()) ||
      c.email.toLowerCase().includes(formData.email.toLowerCase())
  );

  // Step 1: Validate, Fetch Rate, and move to Review
  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true); // Show loading while fetching rate

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be positive");
      setLoading(false);
      return;
    }
    if (!formData.email) {
      setError("Email is required");
      setLoading(false);
      return;
    }
    if (!formData.dueDate) {
      setError("Payment date is required");
      setLoading(false);
      return;
    }

    try {
      // Fetch Live Rate
      const rate = await getExchangeRate(formData.currency, "USD");
      setCurrentRate(rate);

      const costInUsd = amount * rate;
      setEstimatedCost(costInUsd);

      // Check balance for immediate payments
      const dueDate = new Date(formData.dueDate);
      const isToday = new Date().toDateString() === dueDate.toDateString();

      if (isToday && costInUsd > balance) {
        setError(
          `Insufficient balance. Cost: $${costInUsd.toFixed(
            2
          )} vs Balance: $${balance.toFixed(2)}`
        );
        setLoading(false);
        return;
      }

      setStep("review");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch exchange rates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Execute Transaction
  const handleConfirm = async () => {
    if (!db) return;
    setLoading(true);
    setError("");

    try {
      const amount = parseFloat(formData.amount);

      // Find recipient or implicit creation
      let recipientCompany = companies.find((c) => c.email === formData.email);

      if (!recipientCompany) {
        const existing = await db.getFromIndex(
          "companies",
          "email",
          formData.email
        );
        if (existing) {
          recipientCompany = existing;
        } else {
          recipientCompany = {
            id: uuid(),
            name: "New Company",
            email: formData.email,
          };
          await db.add("companies", recipientCompany);
        }
      }

      const dueDate = new Date(formData.dueDate);
      const isToday = new Date().toDateString() === dueDate.toDateString();

      const transactionData = {
        amount,
        currency: formData.currency,
        exchangeRate: currentRate, // Store the rate used for calculation
        fromCompanyId: CURRENT_COMPANY_ID,
        toCompanyId: recipientCompany?.id ?? null, // Safe access with fallback to null
        createdAt: new Date(),
        metadata: {
          description: formData.description || "Payment",
          recipientEmail: formData.email,
        },
      };

      if (isToday) {
        await db.add("transactions", {
          ...transactionData,
          id: uuid(),
          type: "payment_sent",
          status: "completed",
        });
        // For the recipient, we record it as well (mocking the other side)
        await db.add("transactions", {
          ...transactionData,
          id: uuid(),
          type: "payment_received",
          status: "completed",
        });
      } else {
        await db.add("transactions", {
          ...transactionData,
          id: uuid(),
          type: "payment_sent",
          status: "pending",
          scheduledFor: dueDate,
        });
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (company: Company) => {
    setFormData({ ...formData, email: company.email });
    setShowSuggestions(false);
  };

  const openCreateModal = () => {
    setNewCompanyData({
      name: "",
      email: formData.email,
      walletAddress: "",
    });
    setShowSuggestions(false);
    setShowCreateModal(true);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    try {
      const newCompany: Company = {
        id: uuid(),
        name: newCompanyData.name,
        email: newCompanyData.email,
        walletAddress: newCompanyData.walletAddress || undefined,
      };

      await db.add("companies", newCompany);
      await fetchCompanies();
      setFormData({ ...formData, email: newCompany.email });
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create company.");
    }
  };

  // View: Success
  if (step === "success") {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-6 pt-20">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
          ✓
        </div>
        <h2 className="text-2xl font-semibold">Payment Sent</h2>
        <p className="text-gray-500">
          Your payment of {formData.currency} {formData.amount} to{" "}
          {formData.email} has been processed.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Button
            variant="outline"
            onClick={() => router.push("/transactions")}
          >
            View Transactions
          </Button>
          <Button
            onClick={() => {
              setStep("form");
              setFormData({ ...formData, amount: "", description: "" });
            }}
          >
            Send Another
          </Button>
        </div>
      </div>
    );
  }

  // View: Review
  if (step === "review") {
    const afterBalance = balance - estimatedCost;
    const recipientName =
      companies.find((c) => c.email === formData.email)?.name || formData.email;

    return (
      <div className="max-w-[480px] mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-semibold">Review Payment</h2>
          <p className="text-gray-500 mt-1">Please confirm the details below</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 space-y-6 mb-8">
          <div className="text-center pb-6 border-b border-gray-200">
            <div className="text-sm text-gray-500 mb-1 uppercase tracking-wide">
              Amount
            </div>
            <div className="text-4xl font-medium">
              <span className="text-2xl align-top mr-1">
                {formData.currency}
              </span>
              {formData.amount}
            </div>
            {formData.currency !== "USD" && (
              <div className="text-sm text-gray-500 mt-2">
                ≈ $
                {estimatedCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USD
                <span className="block text-xs text-gray-400 mt-0.5">
                  Rate: 1 {formData.currency} = ${currentRate.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">To</span>
              <span className="font-medium text-right">{recipientName}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">
                {new Date(formData.dueDate).toLocaleDateString()}
              </span>
            </div>
            {formData.description && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Description</span>
                <span className="font-medium max-w-[200px] truncate">
                  {formData.description}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="border rounded-xl p-6 space-y-4 mb-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            <Wallet className="w-4 h-4" />
            Balance Impact
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Current Balance</span>
            <span className="font-mono text-gray-900">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm text-red-600">
            <span>Payment (Est.)</span>
            <span className="font-mono">
              -$
              {estimatedCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="h-px bg-gray-100 my-2" />

          <div className="flex justify-between items-center font-medium">
            <span className="text-gray-900">New Balance</span>
            <span className="font-mono text-black">
              $
              {afterBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => setStep("form")}
            className="flex-1 h-12"
          >
            Back
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-[2] bg-black text-white hover:bg-gray-800 h-12 rounded-lg"
          >
            {loading ? "Processing..." : "Confirm & Send"}
          </Button>
        </div>
      </div>
    );
  }

  // View: Form (Initial State)
  return (
    <div className="max-w-[480px] mx-auto px-4 py-12 relative">
      <form onSubmit={handleReview}>
        {/* Amount Section */}
        <div className="text-center mb-12 space-y-2">
          <h1 className="text-base font-medium text-black">Amount</h1>

          <div className="relative flex flex-col items-center justify-center py-4 z-20">
            {/* Currency Selector */}
            <div
              className="relative mb-1"
              ref={currencyRef}
            >
              <button
                type="button"
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="flex items-center gap-1 text-sm font-medium text-gray-500 uppercase tracking-wide hover:text-black transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
              >
                {formData.currency}
                <ChevronDown className="w-3 h-3" />
              </button>

              {showCurrencyDropdown && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[100px]">
                  {CURRENCIES.map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, currency: curr });
                        setShowCurrencyDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        formData.currency === curr
                          ? "font-semibold text-black"
                          : "text-gray-600"
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="0.00"
              className="w-full text-center text-6xl font-normal text-gray-400 placeholder:text-gray-200 focus:text-black outline-none bg-transparent p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
            />
          </div>

          <p className="text-sm text-gray-400">
            Balance Available: $
            {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <hr className="border-gray-100 mb-8" />

        {/* Form Fields */}
        <div className="space-y-6">
          <div
            className="space-y-2 relative"
            ref={wrapperRef}
          >
            <label className="text-sm font-semibold text-black">
              To<span className="text-black">*</span>
            </label>
            <Input
              type="text"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Type an email to find a Vero account or send an invite"
              className="h-12 px-4 bg-white border-gray-200 rounded-lg focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-0 placeholder:text-gray-400"
              required
              autoComplete="off"
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto py-1">
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => (
                    <div
                      key={company.id}
                      onClick={() => selectCompany(company)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {company.name}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {company.email}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No existing companies found
                  </div>
                )}

                {/* Create Company Action */}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="w-full px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 text-blue-600"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">
                      Create new company
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-black">
              Payment Date<span className="text-black">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <Calendar className="w-5 h-5" />
              </div>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="h-12 pl-12 pr-4 bg-white border-gray-200 rounded-lg focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-0 text-gray-600 w-full block"
                required
              />
              {!formData.dueDate && (
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  Pick a date
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-black">
              Description
            </label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Hey ACME"
              className="h-12 px-4 bg-white border-gray-200 rounded-lg focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-0 placeholder:text-gray-400"
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mt-12 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="text-base font-medium text-gray-600 hover:text-black hover:bg-gray-50 px-6 h-12"
          >
            Back
          </Button>

          <Button
            type="submit"
            className="bg-black text-white hover:bg-gray-800 rounded-lg px-8 h-12 text-base font-medium flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                Continue <span className="ml-1">→</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Add New Company</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateCompany}
              className="p-6 space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <Input
                  required
                  placeholder="Acme Corp"
                  value={newCompanyData.name}
                  onChange={(e) =>
                    setNewCompanyData({
                      ...newCompanyData,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  required
                  type="email"
                  placeholder="billing@acme.com"
                  value={newCompanyData.email}
                  onChange={(e) =>
                    setNewCompanyData({
                      ...newCompanyData,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Wallet Address{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <Input
                  placeholder="0x..."
                  value={newCompanyData.walletAddress}
                  onChange={(e) =>
                    setNewCompanyData({
                      ...newCompanyData,
                      walletAddress: e.target.value,
                    })
                  }
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Company</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
