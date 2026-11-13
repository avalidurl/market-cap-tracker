/**
 * NVIDIA quote for the market-cap tracker.
 *
 * Tries Alpha Vantage when ALPHA_VANTAGE_API_KEY is set, then falls back
 * to the keyless Yahoo Finance chart API. Results are cached for 1 hour
 * via the Cache API.
 */

const SHARES_OUTSTANDING = 24.4e9;
const CACHE_TTL = 3600;
const YAHOO_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart/NVDA?interval=1d&range=5d";
const YAHOO_UA =
  "gokhan-market-cap-tracker/1.0 (+https://github.com/avalidurl/market-cap-tracker)";

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control":
        status === 200
          ? `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`
          : "no-store",
      "Access-Control-Allow-Origin": "*",
      ...extra,
    },
  });
}

function payload({ price, change, changePercent, marketCap, source }) {
  const cap =
    marketCap != null
      ? (marketCap / 1e12).toFixed(2)
      : ((price * SHARES_OUTSTANDING) / 1e12).toFixed(2);
  return {
    price,
    change,
    changePercent,
    marketCap: cap,
    timestamp: new Date().toISOString(),
    source,
  };
}

async function fromAlphaVantage(key) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NVDA&apikey=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Alpha Vantage HTTP ${res.status}`);
  const data = await res.json();
  if (data.Information || data.Note) {
    throw new Error("Alpha Vantage rate limit or invalid key");
  }
  const quote = data["Global Quote"];
  if (!quote || !quote["05. price"]) {
    throw new Error("Alpha Vantage returned no quote");
  }
  const price = parseFloat(quote["05. price"]);
  const change = parseFloat(quote["09. change"]);
  const changePercent = parseFloat(
    String(quote["10. change percent"] || "").replace("%", "")
  );
  if (!Number.isFinite(price)) throw new Error("Alpha Vantage price was not a number");
  return payload({ price, change, changePercent, source: "alphavantage" });
}

async function fromYahoo() {
  const res = await fetch(YAHOO_URL, {
    headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  const price = Number(meta?.regularMarketPrice);
  if (!Number.isFinite(price)) throw new Error("Yahoo returned no price");
  const prev = Number(meta?.chartPreviousClose ?? meta?.previousClose);
  const change = Number.isFinite(prev) ? price - prev : 0;
  const changePercent =
    Number.isFinite(prev) && prev !== 0 ? (change / prev) * 100 : 0;
  return payload({
    price,
    change: Number(change.toFixed(4)),
    changePercent: Number(changePercent.toFixed(4)),
    source: "yahoo",
  });
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/nvidia", context.request.url).toString(), {
    method: "GET",
  });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const errors = [];
  const key = context.env?.ALPHA_VANTAGE_API_KEY;
  if (key) {
    try {
      const body = await fromAlphaVantage(key);
      const response = json(body);
      context.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (err) {
      errors.push(`alphavantage: ${err.message || err}`);
    }
  }

  try {
    const body = await fromYahoo();
    const response = json(body);
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    errors.push(`yahoo: ${err.message || err}`);
    return json(
      { error: "Failed to fetch NVIDIA data", details: errors },
      502
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
