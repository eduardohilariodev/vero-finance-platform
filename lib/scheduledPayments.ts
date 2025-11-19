import { VeroDb } from "./db";
import { Transaction } from "./types";

/**
 * Processes scheduled payments that are due (scheduledFor <= now)
 * and have status "pending". Updates them to "completed" status.
 *
 * @param db - The database instance
 * @returns Array of processed transaction IDs
 */
export async function processScheduledPayments(db: VeroDb): Promise<string[]> {
  const now = new Date();
  const processedIds: string[] = [];

  // Get all pending transactions
  const allTransactions = await db.getAll("transactions");

  // Filter for scheduled payments that are due
  const dueTransactions = allTransactions.filter(
    (tx) =>
      tx.status === "pending" &&
      tx.scheduledFor &&
      new Date(tx.scheduledFor) <= now
  );

  // Process each due transaction
  for (const tx of dueTransactions) {
    try {
      // Update transaction status to completed
      await db.put("transactions", {
        ...tx,
        status: "completed",
      });

      processedIds.push(tx.id);
    } catch (error) {
      console.error(`Failed to process scheduled transaction ${tx.id}:`, error);
    }
  }

  return processedIds;
}

/**
 * Checks if a transaction is scheduled and due
 */
export function isScheduledPaymentDue(tx: Transaction): boolean {
  return (
    tx.status === "pending" &&
    tx.scheduledFor !== undefined &&
    new Date(tx.scheduledFor) <= new Date()
  );
}

/**
 * Gets all scheduled payments that are due for a specific company
 */
export async function getDueScheduledPayments(
  db: VeroDb,
  companyId: string
): Promise<Transaction[]> {
  const now = new Date();

  // Get all transactions for this company
  const [outgoingTxs, incomingTxs] = await Promise.all([
    db.getAllFromIndex("transactions", "fromCompanyId", companyId),
    db.getAllFromIndex("transactions", "toCompanyId", companyId),
  ]);

  // Combine and deduplicate
  const txMap = new Map<string, Transaction>();
  [...outgoingTxs, ...incomingTxs].forEach((tx) => {
    txMap.set(tx.id, tx);
  });

  // Filter for scheduled payments that are due
  return Array.from(txMap.values()).filter(
    (tx) =>
      tx.status === "pending" &&
      tx.scheduledFor &&
      new Date(tx.scheduledFor) <= now
  );
}
