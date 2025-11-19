/**
 * Unit tests for useBalance hook (mocking useDB)
 *
 * IMPORTANT: This test file requires jsdom environment (for React components).
 * Use: bun run test hooks/useBalance.unit.test.tsx
 */

// Import fake-indexeddb FIRST before any other imports that use IndexedDB
import "fake-indexeddb/auto";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useBalance } from "./useBalance";
import { initDB, VeroDb } from "@/lib/db";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";
import { Transaction, Wallet } from "@/lib/types";

// Mock useDB hook
const mockUseDBReturn = vi.fn();
vi.mock("./useDB", () => ({
  useDB: () => mockUseDBReturn(),
}));

describe("useBalance hook (unit tests)", () => {
  let db: Awaited<ReturnType<typeof initDB>>;

  beforeEach(async () => {
    // Initialize database
    db = await initDB();

    // Clear all stores
    await Promise.all([
      db.clear("wallets"),
      db.clear("transactions"),
      db.clear("companies"),
      db.clear("paymentRequests"),
    ]);
  });

  afterEach(async () => {
    if (db) {
      db.close();
    }
    vi.clearAllMocks();
  });

  it("should start with loading state when db is null", () => {
    // Mock useDB to return null db (still loading)
    mockUseDBReturn.mockReturnValue({
      db: null,
      loading: true,
      error: null,
    });

    const { result } = renderHook(() => useBalance());

    expect(result.current.loading).toBe(true);
    expect(result.current.balance).toBe(0);
  });

  it("should fetch wallet and transactions when db is ready", async () => {
    // Setup: Add wallet and transactions
    const wallet: Wallet = {
      companyId: CURRENT_COMPANY_ID,
      balance: 10_000,
      currency: "USDC",
      lastUpdated: new Date(),
    };

    const transactions: Transaction[] = [
      {
        id: "tx-1",
        type: "deposit",
        amount: 5_000,
        currency: "USDC",
        fromCompanyId: "external",
        toCompanyId: CURRENT_COMPANY_ID,
        status: "completed",
        createdAt: new Date(),
      },
    ];

    await db.put("wallets", wallet);
    await db.put("transactions", transactions[0]);

    // Mock useDB to return ready database
    mockUseDBReturn.mockReturnValue({
      db: db as VeroDb,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useBalance());

    // Wait for balance to load
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Expected: $10,000 + $5,000 = $15,000
    expect(result.current.balance).toBe(15_000);
  });

  it("should calculate balance correctly with multiple transactions", async () => {
    const wallet: Wallet = {
      companyId: CURRENT_COMPANY_ID,
      balance: 10_000,
      currency: "USDC",
      lastUpdated: new Date(),
    };

    const transactions: Transaction[] = [
      {
        id: "tx-1",
        type: "deposit",
        amount: 5_000,
        currency: "USDC",
        fromCompanyId: "external",
        toCompanyId: CURRENT_COMPANY_ID,
        status: "completed",
        createdAt: new Date(),
      },
      {
        id: "tx-2",
        type: "payment_sent",
        amount: 1_500,
        currency: "USDC",
        fromCompanyId: CURRENT_COMPANY_ID,
        toCompanyId: "company-2",
        status: "completed",
        createdAt: new Date(),
      },
      {
        id: "tx-3",
        type: "payment_received",
        amount: 500,
        currency: "USDC",
        fromCompanyId: "company-2",
        toCompanyId: CURRENT_COMPANY_ID,
        status: "completed",
        createdAt: new Date(),
      },
    ];

    await db.put("wallets", wallet);
    for (const tx of transactions) {
      await db.put("transactions", tx);
    }

    mockUseDBReturn.mockReturnValue({
      db: db as VeroDb,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useBalance());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Expected: $10,000 + $5,000 - $1,500 + $500 = $14,000
    expect(result.current.balance).toBe(14_000);
  });

  it("should ignore pending transactions", async () => {
    const wallet: Wallet = {
      companyId: CURRENT_COMPANY_ID,
      balance: 10_000,
      currency: "USDC",
      lastUpdated: new Date(),
    };

    const transactions: Transaction[] = [
      {
        id: "tx-1",
        type: "payment_sent",
        amount: 1_000,
        currency: "USDC",
        fromCompanyId: CURRENT_COMPANY_ID,
        toCompanyId: "company-2",
        status: "pending", // Should be ignored
        createdAt: new Date(),
      },
      {
        id: "tx-2",
        type: "payment_received",
        amount: 500,
        currency: "USDC",
        fromCompanyId: "company-2",
        toCompanyId: CURRENT_COMPANY_ID,
        status: "completed",
        createdAt: new Date(),
      },
    ];

    await db.put("wallets", wallet);
    for (const tx of transactions) {
      await db.put("transactions", tx);
    }

    mockUseDBReturn.mockReturnValue({
      db: db as VeroDb,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useBalance());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Expected: $10,000 + $500 (pending $1,000 ignored) = $10,500
    expect(result.current.balance).toBe(10_500);
  });

  it("should handle missing wallet gracefully", async () => {
    // Don't add wallet to database

    mockUseDBReturn.mockReturnValue({
      db: db as VeroDb,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useBalance());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Should not crash, balance should remain 0
    expect(result.current.balance).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it("should update when companyId changes", async () => {
    // Setup: Create wallets for two companies
    const wallet1: Wallet = {
      companyId: "company-1",
      balance: 10_000,
      currency: "USDC",
      lastUpdated: new Date(),
    };

    const wallet2: Wallet = {
      companyId: "company-2",
      balance: 5_000,
      currency: "USDC",
      lastUpdated: new Date(),
    };

    await db.put("wallets", wallet1);
    await db.put("wallets", wallet2);

    mockUseDBReturn.mockReturnValue({
      db: db as VeroDb,
      loading: false,
      error: null,
    });

    const { result, rerender } = renderHook(
      ({ companyId }) => useBalance(companyId),
      {
        initialProps: { companyId: "company-1" },
      }
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.balance).toBe(10_000);

    // Change companyId - this should trigger useEffect to re-run
    rerender({ companyId: "company-2" });

    // Wait for loading to complete after companyId change
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
        expect(result.current.balance).toBe(5_000);
      },
      { timeout: 3000 }
    );
  });

  it("should fetch both incoming and outgoing transactions", async () => {
    const wallet: Wallet = {
      companyId: CURRENT_COMPANY_ID,
      balance: 10_000,
      currency: "USDC",
      lastUpdated: new Date(),
    };

    // Transaction where company is the sender (fromCompanyId)
    const outgoingTx: Transaction = {
      id: "tx-1",
      type: "payment_sent",
      amount: 1_000,
      currency: "USDC",
      fromCompanyId: CURRENT_COMPANY_ID,
      toCompanyId: "company-2",
      status: "completed",
      createdAt: new Date(),
    };

    // Transaction where company is the receiver (toCompanyId)
    const incomingTx: Transaction = {
      id: "tx-2",
      type: "payment_received",
      amount: 2_000,
      currency: "USDC",
      fromCompanyId: "company-2",
      toCompanyId: CURRENT_COMPANY_ID,
      status: "completed",
      createdAt: new Date(),
    };

    await db.put("wallets", wallet);
    await db.put("transactions", outgoingTx);
    await db.put("transactions", incomingTx);

    mockUseDBReturn.mockReturnValue({
      db: db as VeroDb,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useBalance());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Expected: $10,000 - $1,000 + $2,000 = $11,000
    expect(result.current.balance).toBe(11_000);
  });
});
