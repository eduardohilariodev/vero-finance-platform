// Import fake-indexeddb FIRST before any other imports that use IndexedDB
import "fake-indexeddb/auto";

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initDB, VeroDb } from "./db";
import {
  processScheduledPayments,
  isScheduledPaymentDue,
  getDueScheduledPayments,
} from "./scheduledPayments";
import { Transaction } from "./types";

describe("scheduledPayments", () => {
  let db: VeroDb;

  beforeEach(async () => {
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
  });

  describe("processScheduledPayments", () => {
    it("should process scheduled payments that are due", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

      // Create a scheduled payment that is due
      const scheduledTx: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        toCompanyId: "company-2",
        status: "pending",
        scheduledFor: pastDate,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      };

      await db.put("transactions", scheduledTx);

      // Process scheduled payments
      const processedIds = await processScheduledPayments(db);

      expect(processedIds).toHaveLength(1);
      expect(processedIds).toContain("tx-1");

      // Verify transaction status was updated
      const updatedTx = await db.get("transactions", "tx-1");
      expect(updatedTx?.status).toBe("completed");
    });

    it("should not process scheduled payments that are not yet due", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

      // Create a scheduled payment that is not yet due
      const scheduledTx: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        toCompanyId: "company-2",
        status: "pending",
        scheduledFor: futureDate,
        createdAt: new Date(),
      };

      await db.put("transactions", scheduledTx);

      // Process scheduled payments
      const processedIds = await processScheduledPayments(db);

      expect(processedIds).toHaveLength(0);

      // Verify transaction status remains pending
      const tx = await db.get("transactions", "tx-1");
      expect(tx?.status).toBe("pending");
    });

    it("should not process completed transactions", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Create a completed transaction (even if scheduled)
      const completedTx: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        toCompanyId: "company-2",
        status: "completed",
        scheduledFor: pastDate,
        createdAt: new Date(),
      };

      await db.put("transactions", completedTx);

      const processedIds = await processScheduledPayments(db);

      expect(processedIds).toHaveLength(0);
    });

    it("should process multiple scheduled payments", async () => {
      const now = new Date();
      const pastDate1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const pastDate2 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const tx1: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        toCompanyId: "company-2",
        status: "pending",
        scheduledFor: pastDate1,
        createdAt: new Date(),
      };

      const tx2: Transaction = {
        id: "tx-2",
        type: "payment_sent",
        amount: 500,
        currency: "USDC",
        fromCompanyId: "company-1",
        toCompanyId: "company-3",
        status: "pending",
        scheduledFor: pastDate2,
        createdAt: new Date(),
      };

      await db.put("transactions", tx1);
      await db.put("transactions", tx2);

      const processedIds = await processScheduledPayments(db);

      expect(processedIds).toHaveLength(2);
      expect(processedIds).toContain("tx-1");
      expect(processedIds).toContain("tx-2");

      // Verify both transactions were updated
      const updatedTx1 = await db.get("transactions", "tx-1");
      const updatedTx2 = await db.get("transactions", "tx-2");
      expect(updatedTx1?.status).toBe("completed");
      expect(updatedTx2?.status).toBe("completed");
    });

    it("should handle transactions without scheduledFor date", async () => {
      const tx: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        toCompanyId: "company-2",
        status: "pending",
        createdAt: new Date(),
        // No scheduledFor
      };

      await db.put("transactions", tx);

      const processedIds = await processScheduledPayments(db);

      expect(processedIds).toHaveLength(0);
    });
  });

  describe("isScheduledPaymentDue", () => {
    it("should return true for pending transaction with past scheduledFor date", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const tx: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        status: "pending",
        scheduledFor: pastDate,
        createdAt: new Date(),
      };

      expect(isScheduledPaymentDue(tx)).toBe(true);
    });

    it("should return false for completed transaction", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const tx: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        status: "completed",
        scheduledFor: pastDate,
        createdAt: new Date(),
      };

      expect(isScheduledPaymentDue(tx)).toBe(false);
    });

    it("should return false for future scheduled payment", () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const tx: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        status: "pending",
        scheduledFor: futureDate,
        createdAt: new Date(),
      };

      expect(isScheduledPaymentDue(tx)).toBe(false);
    });

    it("should return false for transaction without scheduledFor", () => {
      const tx: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        status: "pending",
        createdAt: new Date(),
      };

      expect(isScheduledPaymentDue(tx)).toBe(false);
    });
  });

  describe("getDueScheduledPayments", () => {
    it("should return due scheduled payments for a company", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const dueTx: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        toCompanyId: "company-2",
        status: "pending",
        scheduledFor: pastDate,
        createdAt: new Date(),
      };

      const futureTx: Transaction = {
        id: "tx-2",
        type: "payment_sent",
        amount: 500,
        currency: "USDC",
        fromCompanyId: "company-1",
        toCompanyId: "company-3",
        status: "pending",
        scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      await db.put("transactions", dueTx);
      await db.put("transactions", futureTx);

      const duePayments = await getDueScheduledPayments(db, "company-1");

      expect(duePayments).toHaveLength(1);
      expect(duePayments[0].id).toBe("tx-1");
    });

    it("should return empty array when no scheduled payments are due", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const futureTx: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        toCompanyId: "company-2",
        status: "pending",
        scheduledFor: futureDate,
        createdAt: new Date(),
      };

      await db.put("transactions", futureTx);

      const duePayments = await getDueScheduledPayments(db, "company-1");

      expect(duePayments).toHaveLength(0);
    });

    it("should include both incoming and outgoing transactions", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const outgoingTx: Transaction = {
        id: "tx-1",
        type: "payment_sent",
        amount: 1000,
        currency: "USDC",
        fromCompanyId: "company-1",
        toCompanyId: "company-2",
        status: "pending",
        scheduledFor: pastDate,
        createdAt: new Date(),
      };

      const incomingTx: Transaction = {
        id: "tx-2",
        type: "payment_received",
        amount: 500,
        currency: "USDC",
        fromCompanyId: "company-2",
        toCompanyId: "company-1",
        status: "pending",
        scheduledFor: pastDate,
        createdAt: new Date(),
      };

      await db.put("transactions", outgoingTx);
      await db.put("transactions", incomingTx);

      const duePayments = await getDueScheduledPayments(db, "company-1");

      expect(duePayments).toHaveLength(2);
      expect(duePayments.map((tx) => tx.id)).toContain("tx-1");
      expect(duePayments.map((tx) => tx.id)).toContain("tx-2");
    });
  });
});
