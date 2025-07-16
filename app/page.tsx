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
  const [copiedSolana, setCopiedSolana] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      trackEvent('navigation_click', {
        event_category: 'engagement',
        event_label: sectionId,
      });
    }
  };

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

  // Check for privacy popup on first visit
  useEffect(() => {
    const hasSeenPrivacyPopup = localStorage.getItem('hasSeenPrivacyPopup');
    if (!hasSeenPrivacyPopup) {
      setShowPrivacyPopup(true);
    }
  }, []);

  // Handle privacy popup acceptance
  const handlePrivacyAccept = () => {
    localStorage.setItem('hasSeenPrivacyPopup', 'true');
    setShowPrivacyPopup(false);
    trackEvent('privacy_popup_accepted', {
      event_category: 'privacy',
      event_label: 'Privacy Disclaimer Accepted',
    });
  };

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
      {/* Top Navigation */}
      <div className="fixed top-4 right-4 z-50 flex flex-col sm:flex-row gap-2 sm:gap-4">
        <button
          onClick={() => scrollToSection('community')}
          className="flex items-center justify-center gap-1 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg transition-all duration-200 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-600"
        >
          <span className="sm:hidden">💬</span>
          <span className="hidden sm:inline">💬 Community</span>
        </button>
        <button
          onClick={() => scrollToSection('donate')}
          className="flex items-center justify-center gap-1 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg transition-all duration-200 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:text-green-600"
        >
          <span className="sm:hidden">💰</span>
          <span className="hidden sm:inline">💰 Donate</span>
        </button>
        <button
          onClick={() => scrollToSection('disclaimer')}
          className="flex items-center justify-center gap-1 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg transition-all duration-200 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:text-amber-600"
        >
          <span className="sm:hidden">⚠️</span>
          <span className="hidden sm:inline">⚠️ Disclaimer</span>
        </button>
      </div>

      {/* Privacy Popup */}
      {showPrivacyPopup && (
        <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-full mx-4">
          <div className="bg-white rounded-lg shadow-2xl border transform transition-all duration-300 slide-up">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-blue-600 text-lg mr-2">🔒</span>
                  <h3 className="text-sm font-semibold text-gray-900">Privacy Notice</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPrivacyPopup(false);
                    trackEvent('privacy_popup_dismissed', {
                      event_category: 'privacy',
                      event_label: 'Privacy Disclaimer Dismissed',
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>
              
              <p className="text-xs text-gray-700 mb-3">
                We use Google Analytics for anonymous usage statistics. No personal data is collected.
              </p>

              <button
                onClick={handlePrivacyAccept}
                className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            NVIDIA vs Crypto Market Cap
          </h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-600">Real-time comparison</p>
            <div className="relative group">
              <div 
                className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs cursor-help md:cursor-help touch:cursor-pointer select-none"
                onClick={() => {
                  // Only handle click on mobile/tablet
                  setShowTooltip(!showTooltip);
                  trackEvent('info_tooltip_view', {
                    event_category: 'engagement',
                    event_label: 'Update Frequency Info',
                  });
                }}
                onMouseEnter={() => trackEvent('info_tooltip_view', {
                  event_category: 'engagement',
                  event_label: 'Update Frequency Info',
                })}
              >
                i
              </div>
              
              {/* Desktop hover tooltip */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 text-gray-800 text-xs rounded-lg px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50 shadow-xl hidden md:block">
                <div className="text-center">
                  <div className="font-semibold mb-2 text-gray-900">Update Frequencies:</div>
                  <div className="mb-1">• NVIDIA: Every hour</div>
                  <div className="mb-1">• Crypto: Every hour (synced for consistency)</div>
                  <div className="text-gray-500 mt-2 text-xs">Both cached for performance</div>
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 translate-y-px w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-300"></div>
              </div>

              {/* Mobile/tablet click tooltip */}
              {showTooltip && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 text-gray-800 text-xs rounded-lg px-4 py-3 z-50 shadow-xl max-w-xs md:hidden">
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
                    className="absolute -top-2 -right-2 w-5 h-5 bg-gray-400 text-white rounded-full text-xs flex items-center justify-center"
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

        {/* Data Sources */}
        <div className="text-center text-sm text-gray-600 mb-8">
          <p>
            Data sources: <a href="https://www.alphavantage.co" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Alpha Vantage</a> (NVIDIA), <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">CoinGecko</a> (Crypto) | 
            Built with <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Next.js</a> on <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Vercel</a>
          </p>
        </div>

        {/* Community Section */}
        <div id="community" className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">💬 Community</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <a
              href="https://t.me/marketresearchunit"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => trackLinkClick('Telegram Channel', 'https://t.me/marketresearchunit')}
            >
              📱 Telegram Channel
            </a>
            <a
              href="https://t.me/marketresearchbox"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => trackLinkClick('Telegram Group', 'https://t.me/marketresearchbox')}
            >
              💬 Telegram Group
            </a>
            <a
              href="https://discord.gg/ZJpnhF3bDn"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
              onClick={() => trackLinkClick('Discord Server', 'https://discord.gg/ZJpnhF3bDn')}
            >
              🎮 Discord Server
            </a>
            <a
              href="https://x.com/0xgokhan"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              onClick={() => trackLinkClick('Twitter Profile', 'https://x.com/0xgokhan')}
            >
              🐦 Twitter
            </a>
            <a
              href="https://sp500-capex.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              onClick={() => trackLinkClick('SP100 CapEx', 'https://sp500-capex.vercel.app/')}
            >
              📊 SP100 CapEx
            </a>
          </div>
        </div>

        {/* Donate Section */}
        <div id="donate" className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">💰 Support This Project</h2>
            <p className="text-gray-600 text-sm">Support this project so that we can provide you with better data</p>
          </div>
          <div className="max-w-xl mx-auto space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">EVM</span>
                <span className="text-xs text-gray-500">Click to copy</span>
              </div>
              <div className="relative">
                <code 
                  className="bg-white px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-100 transition-colors block break-all border"
                  onClick={() => {
                    navigator.clipboard.writeText('0x36de990133D36d7E3DF9a820aA3eDE5a2320De71');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    trackEvent('donation_address_copy', {
                      event_category: 'engagement',
                      event_label: 'EVM API Support Donation',
                    });
                  }}
                  title="Click to copy EVM address"
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
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Solana</span>
                <span className="text-xs text-gray-500">Click to copy</span>
              </div>
              <div className="relative">
                <code 
                  className="bg-white px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-100 transition-colors block break-all border"
                  onClick={() => {
                    navigator.clipboard.writeText('J1ALikLy5TZ9tqZq5zxSem5P9G4Wo6fXXWSGGjEvd9Pg');
                    setCopiedSolana(true);
                    setTimeout(() => setCopiedSolana(false), 2000);
                    trackEvent('donation_address_copy', {
                      event_category: 'engagement',
                      event_label: 'Solana Mac Mini Donation',
                    });
                  }}
                  title="Click to copy Solana address"
                >
                  J1ALikLy5TZ9tqZq5zxSem5P9G4Wo6fXXWSGGjEvd9Pg
                </code>
                {copiedSolana && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg animate-pulse">
                    Copied!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Section */}
        <div id="disclaimer" className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">⚠️ Disclaimer</h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="text-amber-800">
                <strong>Nothing on this website constitutes financial investment advice.</strong> 
                This is for informational purposes only. Market data is provided &quot;as is&quot; without warranty. 
                Consult qualified financial professionals before making investment decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
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
        </div>
      </div>
    </div>
  );
}
