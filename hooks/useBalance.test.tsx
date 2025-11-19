/**
 * Integration tests for useDB and useBalance hooks working together
 *
 * IMPORTANT: This test file requires jsdom environment (for React components).
 * Use: bun run test hooks/useBalance.test.tsx
 * NOT: bun test (Bun's test runner doesn't support jsdom)
 *
 * Note: For unit tests of individual hooks, see:
 * - hooks/useDB.test.tsx (unit tests for useDB)
 * - hooks/useBalance.unit.test.tsx (unit tests for useBalance with mocked useDB)
 */

// Import fake-indexeddb FIRST before any other imports that use IndexedDB
import "fake-indexeddb/auto";

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useDB } from "./useDB";
import { useBalance } from "./useBalance";
import { initDB } from "@/lib/db";
import { mockWallet, mockTransactions, CURRENT_COMPANY_ID } from "@/lib/mocks";
import { Transaction, Wallet } from "@/lib/types";

// Test component that uses both hooks
function TestBalanceComponent({ companyId }: { companyId?: string }) {
  const { loading: dbLoading, error: dbError } = useDB();
  const { balance, loading: balanceLoading } = useBalance(companyId);

  if (dbLoading) {
    return <div data-testid="db-loading">Loading database...</div>;
  }

  if (dbError) {
    return <div data-testid="db-error">Database error: {dbError.message}</div>;
  }

  if (balanceLoading) {
    return <div data-testid="balance-loading">Loading balance...</div>;
  }

  return (
    <div>
      <div data-testid="balance">${balance.toLocaleString()}</div>
      <div data-testid="db-ready">Database ready</div>
    </div>
  );
}

describe("useDB and useBalance hooks integration", () => {
  let db: Awaited<ReturnType<typeof initDB>>;

  beforeEach(async () => {
    // Initialize database before each test
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
    // Close database after each test
    if (db) {
      db.close();
    }

    // Clear IndexedDB for next test
    // Note: In a real test environment, you might need fake-indexeddb
    // For now, we'll rely on clearing the stores
  });

  it("should create test component that uses both hooks", async () => {
    // Populate database with mock data
    const wallet = mockWallet(CURRENT_COMPANY_ID);
    await db.put("wallets", wallet);

    const { container } = render(<TestBalanceComponent />);

    // Component should render (even if loading)
    expect(container).toBeTruthy();
  });

  it("should verify data loads correctly", async () => {
    // Setup: Add wallet and transactions to database
    const wallet = mockWallet(CURRENT_COMPANY_ID);
    const transactions = mockTransactions();

    await db.put("wallets", wallet);
    for (const tx of transactions) {
      await db.put("transactions", tx);
    }

    // Render component
    render(<TestBalanceComponent />);

    // Wait for database to load
    await waitFor(
      () => {
        expect(screen.queryByTestId("db-loading")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify database is ready
    await waitFor(() => {
      expect(screen.getByTestId("db-ready")).toBeInTheDocument();
    });

    // Verify no database errors
    expect(screen.queryByTestId("db-error")).not.toBeInTheDocument();
  });

  it("should verify balance displays correct value", async () => {
    // Setup: Create wallet with $10,000 initial balance
    const wallet: Wallet = {
      companyId: CURRENT_COMPANY_ID,
      balance: 10_000,
      currency: "USDC",
      lastUpdated: new Date(),
    };

    // Create transactions:
    // - Deposit: +$5,000 (from external, to company-1)
    // - Payment sent: -$1,500 (from company-1, to company-2)
    // - Expected balance: $10,000 + $5,000 - $1,500 = $13,500
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
    ];

    // Populate database
    await db.put("wallets", wallet);
    for (const tx of transactions) {
      await db.put("transactions", tx);
    }

    // Render component
    render(<TestBalanceComponent />);

    // Wait for balance to load
    await waitFor(
      () => {
        expect(screen.queryByTestId("balance-loading")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify balance displays correct value: $13,500
    await waitFor(() => {
      const balanceElement = screen.getByTestId("balance");
      expect(balanceElement).toBeInTheDocument();
      expect(balanceElement.textContent).toBe("$13,500");
    });
  });

  it("should handle balance calculation with only incoming transactions", async () => {
    // Setup: Wallet with $10,000, only incoming transactions
    const wallet: Wallet = {
      companyId: CURRENT_COMPANY_ID,
      balance: 10_000,
      currency: "USDC",
      lastUpdated: new Date(),
    };

    const transactions: Transaction[] = [
      {
        id: "tx-1",
        type: "payment_received",
        amount: 2_000,
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

    render(<TestBalanceComponent />);

    await waitFor(
      () => {
        expect(screen.queryByTestId("balance-loading")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Expected: $10,000 + $2,000 = $12,000
    await waitFor(() => {
      const balanceElement = screen.getByTestId("balance");
      expect(balanceElement.textContent).toBe("$12,000");
    });
  });

  it("should ignore pending transactions in balance calculation", async () => {
    // Setup: Wallet with $10,000
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

    render(<TestBalanceComponent />);

    await waitFor(
      () => {
        expect(screen.queryByTestId("balance-loading")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Expected: $10,000 + $500 (pending $1,000 ignored) = $10,500
    await waitFor(() => {
      const balanceElement = screen.getByTestId("balance");
      expect(balanceElement.textContent).toBe("$10,500");
    });
  });

  it("should update balance when companyId changes", async () => {
    // Setup: Create wallets and transactions for two companies
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

    // Render with company-1
    const { rerender } = render(<TestBalanceComponent companyId="company-1" />);

    await waitFor(
      () => {
        expect(screen.queryByTestId("balance-loading")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      const balanceElement = screen.getByTestId("balance");
      expect(balanceElement.textContent).toBe("$10,000");
    });

    // Change to company-2
    rerender(<TestBalanceComponent companyId="company-2" />);

    await waitFor(
      () => {
        expect(screen.queryByTestId("balance-loading")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      const balanceElement = screen.getByTestId("balance");
      expect(balanceElement.textContent).toBe("$5,000");
    });
  });

  it("should process scheduled payments before calculating balance", async () => {
    // Setup: Create wallet with initial balance
    const wallet: Wallet = {
      companyId: CURRENT_COMPANY_ID,
      balance: 10_000,
      currency: "USDC",
      lastUpdated: new Date(),
    };

    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

    // Create a scheduled payment that is due (should be processed)
    // Note: status MUST be "pending" for the processor to pick it up.
    // "scheduled" is not a valid TransactionStatus type.
    const scheduledTx: Transaction = {
      id: "tx-scheduled",
      type: "payment_sent",
      amount: 1_000,
      currency: "USDC",
      fromCompanyId: CURRENT_COMPANY_ID,
      toCompanyId: "company-2",
      status: "pending",
      scheduledFor: pastDate,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    };

    await db.put("wallets", wallet);
    await db.put("transactions", scheduledTx);

    // Render component - this should trigger scheduled payment processing via useBalance hook
    render(<TestBalanceComponent />);

    // Wait for balance to load
    await waitFor(
      () => {
        expect(screen.queryByTestId("balance-loading")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify scheduled payment was processed (status changed to completed)
    // We wrap this in waitFor to handle any slight async delay in the DB update persisting
    await waitFor(async () => {
      const processedTx = await db.get("transactions", "tx-scheduled");
      expect(processedTx?.status).toBe("completed");
    });

    // Verify balance reflects the processed payment: $10,000 - $1,000 = $9,000
    await waitFor(() => {
      const balanceElement = screen.getByTestId("balance");
      expect(balanceElement.textContent).toBe("$9,000");
    });
  });
});
