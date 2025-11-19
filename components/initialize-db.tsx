"use client";
import { useEffect } from "react";
import { useDB } from "@/hooks/useDB";
import {
  mockCompanies,
  mockWallet,
  mockTransactions,
  mockPaymentRequests,
  CURRENT_COMPANY_ID,
} from "@/lib/mocks";

export function InitializeDB() {
  const { db } = useDB();

  useEffect(() => {
    if (!db) return;

    (async () => {
      try {
        // Check if already initialized
        const existing = await db.get("companies", CURRENT_COMPANY_ID);
        if (existing) return; // Already seeded

        // Seed companies
        const companies = mockCompanies();
        for (const company of companies) {
          await db.add("companies", company);
        }

        // Seed wallets
        for (const company of companies) {
          const wallet = mockWallet(company.id);
          await db.add("wallets", wallet);
        }

        // Seed transactions
        const transactions = mockTransactions();
        for (const tx of transactions) {
          await db.add("transactions", tx);
        }

        // Seed payment requests
        const requests = mockPaymentRequests();
        for (const req of requests) {
          await db.add("paymentRequests", req);
        }

        console.log("✓ Database initialized with mock data");
      } catch (error) {
        console.error("Failed to initialize DB:", error);
      }
    })();
  }, [db]);

  return null;
}
