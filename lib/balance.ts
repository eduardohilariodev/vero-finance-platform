// lib/balance.ts
import { Transaction } from "./types";

export function calculateBalance(
  initialBalance: number,
  transactions: Transaction[]
): number {
  return transactions.reduce((balance, tx) => {
    if (tx.status !== "completed") return balance;

    // Determine the value in Base Currency (USD)
    // If exchangeRate is stored, use it. Otherwise default to 1 (assume USD/USDC 1:1)
    const rate = tx.exchangeRate || 1;
    const valueInBase = tx.amount * rate;

    if (["payment_sent", "withdrawal"].includes(tx.type)) {
      const fee = tx.metadata?.networkFee || 0;
      return balance - valueInBase - fee;
    }

    if (["payment_received", "deposit"].includes(tx.type)) {
      return balance + valueInBase;
    }

    return balance;
  }, initialBalance);
}
