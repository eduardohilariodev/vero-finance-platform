// lib/balance.test.ts
import { describe, it, expect } from "vitest";
import { calculateBalance } from "./balance";
import { Transaction } from "./types";

describe("calculateBalance", () => {
  it("should deduct payments based on exchange rate (ETH to USD)", () => {
    const tx: Transaction = {
      id: "1",
      type: "payment_sent",
      amount: 1, // 1 ETH
      currency: "ETH",
      exchangeRate: 3000, // 1 ETH = $3000 USD
      fromCompanyId: "c1",
      status: "completed",
      createdAt: new Date(),
    };
    // 10,000 - (1 * 3000) = 7,000
    expect(calculateBalance(10_000, [tx])).toBe(7_000);
  });

  it("should add payments based on exchange rate (EUR to USD)", () => {
    const tx: Transaction = {
      id: "1",
      type: "payment_received",
      amount: 100, // 100 EUR
      currency: "EUR",
      exchangeRate: 1.1, // 1 EUR = $1.10 USD
      toCompanyId: "c1",
      status: "completed",
      createdAt: new Date(),
      fromCompanyId: "",
    };
    // 10,000 + (100 * 1.1) = 10,110
    expect(calculateBalance(10_000, [tx])).toBe(10_110);
  });

  it("should default to rate of 1 if missing", () => {
    const tx: Transaction = {
      id: "1",
      type: "payment_sent",
      amount: 500,
      currency: "USDC",
      fromCompanyId: "c1",
      status: "completed",
      createdAt: new Date(),
    };
    expect(calculateBalance(10_000, [tx])).toBe(9_500);
  });

  it("should handle mixed currencies", () => {
    const txs: Transaction[] = [
      {
        id: "1",
        type: "payment_sent",
        amount: 1, // 1 ETH
        currency: "ETH",
        exchangeRate: 2000,
        status: "completed",
        createdAt: new Date(),
      } as Transaction,
      {
        id: "2",
        type: "payment_received",
        amount: 1000, // 1000 USD
        currency: "USD",
        exchangeRate: 1,
        status: "completed",
        createdAt: new Date(),
      } as Transaction,
    ];
    // 10,000 - 2000 + 1000 = 9,000
    expect(calculateBalance(10_000, txs)).toBe(9_000);
  });
});
