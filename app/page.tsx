'use client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NvidiaData {
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  timestamp: string;
}

interface CryptoData {
  data: {
    total_market_cap: {
      usd: number;
    };
    market_cap_percentage: {
      btc: number;
    };
    active_cryptocurrencies: number;
  };
}

export default function Home() {
  const { data: nvidiaData, error: nvidiaError } = useSWR<NvidiaData>(
    '/api/nvidia',
    fetcher,
    { refreshInterval: 3600000 } // 1 hour (3,600,000ms)
  );

  const { data: cryptoData, error: cryptoError } = useSWR<CryptoData>(
    'https://api.coingecko.com/api/v3/global',
    fetcher,
    { refreshInterval: 3600000 } // 1 hour (3,600,000ms)
  );

  if (nvidiaError || cryptoError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
          <p className="text-gray-600">Please refresh the page</p>
          {nvidiaError && <p className="text-sm text-gray-500">NVIDIA API Error</p>}
          {cryptoError && <p className="text-sm text-gray-500">Crypto API Error</p>}
        </div>
      </div>
    );
  }

  if (!nvidiaData || !cryptoData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading market data...</p>
        </div>
      </div>
    );
  }

  // Extract crypto data
  const cryptoMarketCap = cryptoData.data.total_market_cap.usd / 1e12;
  const btcDominance = cryptoData.data.market_cap_percentage.btc;

  // Calculate difference
  const difference = parseFloat(nvidiaData.marketCap) - cryptoMarketCap;
  const percentageDiff = (difference / cryptoMarketCap) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            NVIDIA vs Crypto Market Cap
          </h1>
          <p className="text-gray-600">Real-time comparison</p>
        </div>

        {/* Main Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* NVIDIA */}
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-2">
                ${nvidiaData.marketCap}T
              </div>
              <div className="text-xl font-semibold text-gray-900 mb-2">NVIDIA</div>
              <div className="text-sm text-gray-600">
                Stock Price: ${nvidiaData.price.toFixed(2)}
              </div>
              <div className={`text-sm ${nvidiaData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {nvidiaData.changePercent >= 0 ? '↗' : '↘'} {Math.abs(nvidiaData.changePercent).toFixed(2)}%
              </div>
            </div>

            {/* Crypto */}
            <div className="text-center">
              <div className="text-6xl font-bold text-orange-600 mb-2">
                ${cryptoMarketCap.toFixed(2)}T
              </div>
              <div className="text-xl font-semibold text-gray-900 mb-2">Total Crypto</div>
              <div className="text-sm text-gray-600">
                {cryptoData.data.active_cryptocurrencies.toLocaleString()} Assets
              </div>
              <div className="text-sm text-gray-600">
                BTC Dominance: {btcDominance.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Difference */}
          <div className="mt-8 pt-8 border-t text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              Difference: {difference >= 0 ? '+' : ''}${difference.toFixed(2)}T
            </div>
            <div className="text-lg text-gray-600">
              ({percentageDiff >= 0 ? '+' : ''}{percentageDiff.toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Updates every hour • Secure API integration • Zero hosting costs
        </div>
      </div>
    </div>
  );
}
