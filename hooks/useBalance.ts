"use client";
import { useEffect, useState } from "react";
import { useDB } from "./useDB";
import { calculateBalance } from "@/lib/balance";
import { processScheduledPayments } from "@/lib/scheduledPayments";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";

export function useBalance(
  companyId: string = CURRENT_COMPANY_ID,
  processScheduled: boolean = true
) {
  const { db } = useDB();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    (async () => {
      try {
        // Process scheduled payments that are due before calculating balance
        if (processScheduled) {
          await processScheduledPayments(db);
        }

        const wallet = await db.get("wallets", companyId);

        // Fetch both outgoing and incoming transactions
        const [outgoingTxs, incomingTxs] = await Promise.all([
          db.getAllFromIndex("transactions", "fromCompanyId", companyId),
          db.getAllFromIndex("transactions", "toCompanyId", companyId),
        ]);

        // Combine and deduplicate transactions (in case a tx has both from/to as same company)
        const txMap = new Map();
        [...outgoingTxs, ...incomingTxs].forEach((tx) => {
          txMap.set(tx.id, tx);
        });
        const txs = Array.from(txMap.values());

        if (wallet) {
          const currentBalance = calculateBalance(wallet.balance, txs);
          setBalance(currentBalance);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to load balance:", error);
        setLoading(false);
      }
    })();
  }, [db, companyId, processScheduled]);

  return { balance, loading };
}
