import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number, currency: string) => {
  // 1. Handle Custom/Crypto Currencies
  switch (currency.toUpperCase()) {
    case "USDC":
      // For a stablecoin pegged 1:1 to USD, use the '$' sign
      // The `toLocaleString` is used here for basic number formatting (commas, decimals)
      return `$${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USDC`;
    case "ETH":
      // Use the Ethereum symbol (Ξ) or just the ticker
      return `${amount.toLocaleString("en-US", {
        minimumFractionDigits: 4, // More precision for crypto
        maximumFractionDigits: 4,
      })} ETH`;
    // Add other crypto/mocked currencies here
  }

  // 2. Fallback to Native Intl.NumberFormat for ISO 4217 codes (e.g., USD)
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency, // e.g., 'USD'
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    // 3. Handle Unexpected/Unknown Codes Gracefully
    console.error(`Error formatting currency: ${currency}`, e);
    // Fallback display for any unknown currency
    return `${amount.toLocaleString("en-US")} ${currency}`;
  }
};
