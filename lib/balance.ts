import { Transaction } from "./types";

export function calculateBalance(
  initialBalance: number,
  transactions: Transaction[]
): number {
  return transactions.reduce((balance, tx) => {
    if (tx.status !== "completed") return balance;

    if (["payment_sent", "withdrawal"].includes(tx.type)) {
      return balance - tx.amount;
    }

    if (["payment_received", "deposit"].includes(tx.type)) {
      return balance + tx.amount;
    }

    return balance;
  }, initialBalance);
}
