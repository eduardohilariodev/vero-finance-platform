import { describe, it, expect } from "vitest";
import { calculateBalance } from "./balance";
import { Transaction } from "./types";

describe("calculateBalance", () => {
  it("should start with initial balance", () => {
    const result = calculateBalance(10_000, []);
    expect(result).toBe(10_000);
  });

  it("should deduct payments sent", () => {
    const tx: Transaction = {
      id: "1",
      type: "payment_sent",
      amount: 1000,
      currency: "USDC",
      fromCompanyId: "c1",
      status: "completed",
      createdAt: new Date(),
    };
    expect(calculateBalance(10_000, [tx])).toBe(9_000);
  });

  it("should add received payments", () => {
    const tx: Transaction = {
      id: "1",
      type: "payment_received",
      amount: 500,
      currency: "USDC",
      fromCompanyId: "c2",
      toCompanyId: "c1",
      status: "completed",
      createdAt: new Date(),
    };
    expect(calculateBalance(10_000, [tx])).toBe(10_500);
  });

  it("should ignore pending transactions", () => {
    const tx: Transaction = {
      id: "1",
      type: "payment_sent",
      amount: 1000,
      currency: "USDC",
      fromCompanyId: "c1",
      status: "pending",
      createdAt: new Date(),
    };
    expect(calculateBalance(10_000, [tx])).toBe(10_000);
  });

  it("should handle multiple transactions", () => {
    const txs: Transaction[] = [
      {
        id: "1",
        type: "deposit",
        amount: 5000,
        currency: "USDC",
        fromCompanyId: "external",
        toCompanyId: "c1",
        status: "completed",
        createdAt: new Date(),
      },
      {
        id: "2",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "c1",
        status: "completed",
        createdAt: new Date(),
      },
      {
        id: "3",
        type: "payment_received",
        amount: 500,
        currency: "USDC",
        toCompanyId: "c1",
        status: "completed",
        createdAt: new Date(),
        fromCompanyId: "external",
      },
    ];
    expect(calculateBalance(10_000, txs)).toBe(14_500);
  });

  it("should verify companies are different for payment transactions", () => {
    // Payment received: fromCompanyId and toCompanyId should be different
    const paymentReceived: Transaction = {
      id: "1",
      type: "payment_received",
      amount: 1000,
      currency: "USDC",
      fromCompanyId: "c2", // Sender
      toCompanyId: "c1", // Receiver (different from sender)
      status: "completed",
      createdAt: new Date(),
    };
    expect(calculateBalance(10_000, [paymentReceived])).toBe(11_000);

    // Payment sent: fromCompanyId should be different from toCompanyId (if provided)
    const paymentSent: Transaction = {
      id: "2",
      type: "payment_sent",
      amount: 500,
      currency: "USDC",
      fromCompanyId: "c1", // Sender
      toCompanyId: "c2", // Receiver (different from sender)
      status: "completed",
      createdAt: new Date(),
    };
    expect(calculateBalance(10_000, [paymentSent])).toBe(9_500);

    // Verify both transactions together maintain correct balance
    expect(calculateBalance(10_000, [paymentReceived, paymentSent])).toBe(
      10_500
    );
  });

  it("should deduct network fees from payment_sent transactions", () => {
    const tx: Transaction = {
      id: "1",
      type: "payment_sent",
      amount: 1000,
      currency: "USDC",
      fromCompanyId: "c1",
      status: "completed",
      createdAt: new Date(),
      metadata: {
        networkFee: 50, // $50 fee
      },
    };
    // Expected: $10,000 - $1,000 - $50 = $8,950
    expect(calculateBalance(10_000, [tx])).toBe(8_950);
  });

  it("should deduct network fees from withdrawal transactions", () => {
    const tx: Transaction = {
      id: "1",
      type: "withdrawal",
      amount: 2000,
      currency: "USDC",
      fromCompanyId: "c1",
      status: "completed",
      createdAt: new Date(),
      metadata: {
        networkFee: 100, // $100 gas + offramp fee
      },
    };
    // Expected: $10,000 - $2,000 - $100 = $7,900
    expect(calculateBalance(10_000, [tx])).toBe(7_900);
  });

  it("should handle transactions without fees", () => {
    const tx: Transaction = {
      id: "1",
      type: "payment_sent",
      amount: 1000,
      currency: "USDC",
      fromCompanyId: "c1",
      status: "completed",
      createdAt: new Date(),
      // No metadata.networkFee
    };
    // Should work the same as before (no fee deducted)
    expect(calculateBalance(10_000, [tx])).toBe(9_000);
  });

  it("should not deduct fees from received payments or deposits", () => {
    const depositTx: Transaction = {
      id: "1",
      type: "deposit",
      amount: 5000,
      currency: "USDC",
      fromCompanyId: "external",
      toCompanyId: "c1",
      status: "completed",
      createdAt: new Date(),
      metadata: {
        networkFee: 25, // Fee should not affect deposit amount
      },
    };
    // Expected: $10,000 + $5,000 = $15,000 (fee ignored for deposits)
    expect(calculateBalance(10_000, [depositTx])).toBe(15_000);

    const receivedTx: Transaction = {
      id: "2",
      type: "payment_received",
      amount: 1000,
      currency: "USDC",
      fromCompanyId: "c2",
      toCompanyId: "c1",
      status: "completed",
      createdAt: new Date(),
      metadata: {
        networkFee: 10, // Fee should not affect received amount (sender pays)
      },
    };
    // Expected: $10,000 + $1,000 = $11,000 (fee ignored for received payments)
    expect(calculateBalance(10_000, [receivedTx])).toBe(11_000);
  });

  it("should handle multiple transactions with fees", () => {
    const txs: Transaction[] = [
      {
        id: "1",
        type: "deposit",
        amount: 5000,
        currency: "USDC",
        fromCompanyId: "external",
        toCompanyId: "c1",
        status: "completed",
        createdAt: new Date(),
      },
      {
        id: "2",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "c1",
        toCompanyId: "c2",
        status: "completed",
        createdAt: new Date(),
        metadata: {
          networkFee: 50,
        },
      },
      {
        id: "3",
        type: "withdrawal",
        amount: 500,
        currency: "USDC",
        fromCompanyId: "c1",
        status: "completed",
        createdAt: new Date(),
        metadata: {
          networkFee: 25,
        },
      },
    ];
    // Expected: $10,000 + $5,000 - $1,000 - $50 - $500 - $25 = $13,425
    expect(calculateBalance(10_000, txs)).toBe(13_425);
  });
});
