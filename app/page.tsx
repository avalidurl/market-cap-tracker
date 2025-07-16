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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-lg">🔒</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Privacy & Data Collection</h2>
              </div>
              
              <div className="space-y-4 text-sm text-gray-700">
                <p>
                  <strong>We value your privacy.</strong> This website uses minimal data collection to improve your experience:
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">What we collect:</h3>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Google Analytics:</strong> Anonymous usage statistics, page views, and user interactions</li>
                    <li>• <strong>Performance data:</strong> Page load times and error reporting</li>
                    <li>• <strong>No personal data:</strong> We don&apos;t collect names, emails, or personal information</li>
                    <li>• <strong>Local storage:</strong> Preferences and settings (stored on your device)</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Why we collect this:</h3>
                  <ul className="space-y-1 text-xs text-blue-800">
                    <li>• Improve website performance and user experience</li>
                    <li>• Understand which features are most useful</li>
                    <li>• Fix bugs and technical issues</li>
                    <li>• Keep the service free and accessible</li>
                  </ul>
                </div>

                <p className="text-xs text-gray-600">
                  By continuing to use this site, you consent to our use of Google Analytics for these purposes. 
                  You can disable analytics in your browser settings at any time.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handlePrivacyAccept}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  I Understand
                </button>
                <button
                  onClick={() => {
                    setShowPrivacyPopup(false);
                    trackEvent('privacy_popup_dismissed', {
                      event_category: 'privacy',
                      event_label: 'Privacy Disclaimer Dismissed',
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
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

        {/* Data Sources & Resources Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Data Sources & Resources</h2>
            <p className="text-gray-600">Information about our data sources and technical infrastructure</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 Financial Data Sources</h3>
                <ul className="text-blue-700 text-sm space-y-2">
                  <li>• Yahoo Finance (NVIDIA stock data)</li>
                  <li>• CoinGecko (Cryptocurrency data)</li>
                  <li>• Alpha Vantage (Real-time quotes)</li>
                  <li>• Market cap calculations</li>
                </ul>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">📰 News Sources</h3>
                <ul className="text-green-700 text-sm space-y-2">
                  <li>• Google News API</li>
                  <li>• Financial news aggregation</li>
                  <li>• Real-time market updates</li>
                  <li>• SEC filings integration</li>
                </ul>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">🚀 Infrastructure</h3>
                <ul className="text-purple-700 text-sm space-y-2">
                  <li>• Vercel (Hosting & deployment)</li>
                  <li>• Next.js (React framework)</li>
                  <li>• SWR (Data fetching & caching)</li>
                  <li>• Tailwind CSS (Styling)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Community Section */}
        <div id="community" className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">💬 Community</h2>
            <p className="text-gray-600">Join the conversation about market cap tracking and crypto vs tech stocks</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Follow Updates</h3>
                <p className="text-blue-700 text-sm mb-4">Get the latest insights and market analysis</p>
                <a
                  href="https://x.com/0xgokhan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => trackLinkClick('Twitter Community', 'https://x.com/0xgokhan')}
                >
                  <span>Follow @0xgokhan</span>
                </a>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Other Projects</h3>
                <p className="text-purple-700 text-sm mb-4">Check out SP500 CapEx tracker</p>
                <a
                  href="https://sp500-capex.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  onClick={() => trackLinkClick('SP100 CapEx', 'https://sp500-capex.vercel.app/')}
                >
                  <span>Visit SP100 CapEx</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Donate Section */}
        <div id="donate" className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">💰 Support This Project</h2>
            <p className="text-gray-600">Help us maintain and improve the service with premium API access</p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Why Donate?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Enables premium API tiers for faster, more reliable data</li>
                <li>• Supports server hosting and maintenance costs</li>
                <li>• Allows for new features and improvements</li>
                <li>• Keeps the service free for everyone</li>
              </ul>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">EVM (Ethereum, Polygon, etc.)</span>
                  <span className="text-xs text-gray-500">Click to copy</span>
                </div>
                <div className="relative">
                  <code 
                    className="bg-white px-3 py-2 rounded text-sm cursor-pointer hover:bg-gray-100 transition-colors block break-all border"
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
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Solana</span>
                  <span className="text-xs text-gray-500">Click to copy</span>
                </div>
                <div className="relative">
                  <code 
                    className="bg-white px-3 py-2 rounded text-sm cursor-pointer hover:bg-gray-100 transition-colors block break-all border"
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
        </div>

        {/* Disclaimer Section */}
        <div id="disclaimer" className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">⚠️ Important Disclaimer</h2>
            <p className="text-gray-600">Please read this important information before using this service</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-3">Financial Disclaimer</h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                <strong>Nothing on this website constitutes financial investment advice or recommendations whatsoever.</strong> 
                The information provided is for educational and informational purposes only. Market cap comparisons are provided 
                as data points and should not be interpreted as investment guidance.
              </p>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Accuracy</h4>
                <p>While we strive for accuracy, market data is provided &quot;as is&quot; without warranty. Always verify information with official sources before making any financial decisions.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Not Investment Advice</h4>
                <p>This tool is for informational purposes only. Consult with qualified financial professionals before making investment decisions.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Risk Warning</h4>
                <p>Cryptocurrency and stock investments carry significant risk. Past performance does not guarantee future results. You may lose your entire investment.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Sources</h4>
                <p>NVIDIA data sourced from Yahoo Finance. Cryptocurrency data from CoinGecko. Neither endorses this comparison tool.</p>
              </div>
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
