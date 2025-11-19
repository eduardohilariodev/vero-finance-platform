import { Transaction } from "./types";

export function calculateBalance(
  initialBalance: number,
  transactions: Transaction[]
): number {
  return transactions.reduce((balance, tx) => {
    if (tx.status !== "completed") return balance;

    if (["payment_sent", "withdrawal"].includes(tx.type)) {
      // Subtract transaction amount and any network fees
      const fee = tx.metadata?.networkFee || 0;
      return balance - tx.amount - fee;
    }

    if (["payment_received", "deposit"].includes(tx.type)) {
      // For deposits, fees are typically deducted from the amount received
      // For received payments, the full amount is credited (sender pays fees)
      return balance + tx.amount;
    }

    return balance;
  }, initialBalance);
}
