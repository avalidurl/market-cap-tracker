'use client';
import useSWR from 'swr';
import { useEffect, useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Analytics functions

const trackEvent = (eventName: string, parameters: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

const trackLinkClick = (linkName: string, url: string) => {
  trackEvent('click', {
    event_category: 'engagement',
    event_label: linkName,
    link_url: url,
  });
};

const trackDataLoad = (dataType: string, success: boolean) => {
  trackEvent('data_load', {
    event_category: 'api',
    event_label: dataType,
    success: success,
  });
};

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
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

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

  // Track data loading events
  useEffect(() => {
    if (nvidiaData) {
      trackDataLoad('nvidia', true);
    }
    if (nvidiaError) {
      trackDataLoad('nvidia', false);
    }
  }, [nvidiaData, nvidiaError]);

  useEffect(() => {
    if (cryptoData) {
      trackDataLoad('crypto', true);
    }
    if (cryptoError) {
      trackDataLoad('crypto', false);
    }
  }, [cryptoData, cryptoError]);

  // Track page view
  useEffect(() => {
    trackEvent('page_view', {
      page_title: 'Market Cap Tracker',
      page_location: window.location.href,
    });
  }, []);

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
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-600">Real-time comparison</p>
            <div className="relative">
              <div 
                className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs cursor-pointer select-none"
                onClick={() => {
                  setShowTooltip(!showTooltip);
                  trackEvent('info_tooltip_view', {
                    event_category: 'engagement',
                    event_label: 'Update Frequency Info',
                  });
                }}
                onMouseEnter={() => !showTooltip && setShowTooltip(true)}
                onMouseLeave={() => setTimeout(() => setShowTooltip(false), 3000)}
              >
                i
              </div>
              {showTooltip && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 text-gray-800 text-xs rounded-lg px-4 py-3 z-50 shadow-xl max-w-xs">
                  <div className="text-center">
                    <div className="font-semibold mb-2 text-gray-900">Update Frequencies:</div>
                    <div className="mb-1">• NVIDIA: Every hour</div>
                    <div className="mb-1">• Crypto: Every hour (synced for consistency)</div>
                    <div className="text-gray-500 mt-2 text-xs">Both cached for performance</div>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 translate-y-px w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-300"></div>
                  {/* Close button for mobile */}
                  <button 
                    className="absolute -top-2 -right-2 w-5 h-5 bg-gray-400 text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-600 md:hidden"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTooltip(false);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
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
        <div className="text-center text-sm text-gray-500 space-y-2">
          <div>
            Made by{' '}
            <a 
              href="https://x.com/0xgokhan" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
              onClick={() => trackLinkClick('Twitter Profile', 'https://x.com/0xgokhan')}
            >
              @0xgokhan
            </a>
          </div>
          <div className="text-xs">
            Buy me a Mac Mini: 
            <br />
            <div className="relative inline-block">
              <code 
                className="bg-gray-100 px-1 py-0.5 rounded text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText('0x36de990133D36d7E3DF9a820aA3eDE5a2320De71');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  trackEvent('donation_address_copy', {
                    event_category: 'engagement',
                    event_label: 'Mac Mini Donation',
                  });
                }}
                title="Click to copy address"
              >
                0x36de990133D36d7E3DF9a820aA3eDE5a2320De71
              </code>
              {copied && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg animate-pulse">
                  Copied!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
