// lib/utils/currency.ts

export async function getExchangeRate(
  currency: string,
  base: string = "USD"
): Promise<number> {
  // Standardize to uppercase
  const curr = currency.toUpperCase();
  const baseCurr = base.toUpperCase();

  if (curr === baseCurr) return 1;

  try {
    // Strategy 1: Check Crypto (CoinGecko) if it's ETH/BTC
    if (
      ["ETH", "BTC", "SOL"].includes(curr) ||
      ["ETH", "BTC", "SOL"].includes(baseCurr)
    ) {
      // CoinGecko uses ids, simple mapping for POC
      const ids: Record<string, string> = {
        ETH: "ethereum",
        BTC: "bitcoin",
        SOL: "solana",
        USD: "usd",
        EUR: "eur",
      };

      const fromId = ids[curr];
      const toId = ids[baseCurr]; // usually 'usd'

      if (fromId && baseCurr === "USD") {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${fromId}&vs_currencies=usd`
        );
        const data = await res.json();
        return data[fromId]?.usd || 0;
      }
    }

    // Strategy 2: Fiat (Open Exchange Rates)
    // This API gives rates based on USD by default, or we can ask for a base
    const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurr}`);
    const data = await res.json();

    // If we have the direct rate
    if (data.rates && data.rates[curr]) {
      // The API returns how much 1 BASE is worth in CURR (e.g. 1 USD = 0.95 EUR)
      // We want the value of 1 CURR in BASE (e.g. 1 EUR = 1.05 USD)
      // So we invert the rate provided by the API
      return 1 / data.rates[curr];
    }

    console.warn(`Rate not found for ${curr} to ${baseCurr}, defaulting to 1`);
    return 1;
  } catch (error) {
    console.error("Failed to fetch exchange rate:", error);
    return 1; // Fallback to 1:1 on error to prevent crash
  }
}
