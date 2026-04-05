import * as db from "./db";

/**
 * Supported currencies (ISO 4217 codes)
 */
export const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "MXN",
  "SGD", "HKD", "NZD", "SEK", "NOK", "DKK", "ZAR", "BRL", "RUB", "KRW",
  "THB", "MYR", "PHP", "IDR", "VND", "PKR", "BDT", "LKR", "AED", "SAR"
];

/**
 * Cache duration in milliseconds (24 hours)
 */
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Get exchange rate between two currencies with caching
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  try {
    // Check cache first
    const cached = await db.getExchangeRateFromCache(fromCurrency, toCurrency);
    if (cached) {
      const now = new Date();
      const cacheAge = now.getTime() - new Date(cached.timestamp).getTime();
      if (cacheAge < CACHE_DURATION) {
        return parseFloat(cached.rate.toString());
      }
    }

    // Fetch from external API
    const rate = await fetchExchangeRateFromAPI(fromCurrency, toCurrency);

    // Cache the result
    await db.cacheExchangeRate(fromCurrency, toCurrency, rate);

    return rate;
  } catch (error) {
    console.error("[Exchange Rate] Error:", error);
    // Return 1 as fallback (no conversion)
    return 1;
  }
}

/**
 * Fetch exchange rate from external API
 * Using a free API like exchangerate-api.com or fixer.io
 */
async function fetchExchangeRateFromAPI(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  try {
    // Using exchangerate-api.com free tier
    // Alternative: use fixer.io, openexchangerates.org, or other services
    const apiUrl = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    if (data.rates && data.rates[toCurrency]) {
      return data.rates[toCurrency];
    }

    throw new Error(`Rate not found for ${toCurrency}`);
  } catch (error) {
    console.error("[Exchange Rate API] Error:", error);
    // Fallback: return 1 (no conversion)
    return 1;
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ convertedAmount: number; rate: number }> {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  const convertedAmount = amount * rate;

  return {
    convertedAmount: parseFloat(convertedAmount.toFixed(2)),
    rate,
  };
}

/**
 * Get user's base currency
 */
export async function getUserBaseCurrency(userId: number): Promise<string> {
  try {
    const userCurrency = await db.getUserCurrency(userId);
    return userCurrency?.baseCurrency || "USD";
  } catch (error) {
    console.error("[Get User Base Currency] Error:", error);
    return "USD";
  }
}

/**
 * Set user's base currency
 */
export async function setUserBaseCurrency(
  userId: number,
  baseCurrency: string,
  displayCurrency?: string
): Promise<void> {
  try {
    if (!SUPPORTED_CURRENCIES.includes(baseCurrency)) {
      throw new Error(`Unsupported currency: ${baseCurrency}`);
    }

    await db.upsertUserCurrency({
      userId,
      baseCurrency,
      displayCurrency: displayCurrency || baseCurrency,
      autoConvert: true,
    });
  } catch (error) {
    console.error("[Set User Base Currency] Error:", error);
    throw error;
  }
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = "en-US"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch (error) {
    console.error("[Format Currency] Error:", error);
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$",
    CHF: "CHF",
    CNY: "¥",
    INR: "₹",
    MXN: "$",
    SGD: "S$",
    HKD: "HK$",
    NZD: "NZ$",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    ZAR: "R",
    BRL: "R$",
    RUB: "₽",
    KRW: "₩",
    THB: "฿",
    MYR: "RM",
    PHP: "₱",
    IDR: "Rp",
    VND: "₫",
    PKR: "₨",
    BDT: "৳",
    LKR: "Rs",
    AED: "د.إ",
    SAR: "﷼",
  };

  return symbols[currency] || currency;
}

/**
 * Refresh all cached exchange rates
 */
export async function refreshExchangeRates(): Promise<void> {
  try {
    console.log("[Exchange Rates] Refreshing all cached rates...");

    // Get all unique currency pairs from database
    const pairs = await db.getAllCurrencyPairs();

    for (const pair of pairs) {
      try {
        await getExchangeRate(pair.fromCurrency, pair.toCurrency);
      } catch (error) {
        console.error(
          `[Exchange Rates] Failed to refresh ${pair.fromCurrency}/${pair.toCurrency}:`,
          error
        );
      }
    }

    console.log("[Exchange Rates] Refresh complete");
  } catch (error) {
    console.error("[Exchange Rates] Refresh failed:", error);
  }
}
