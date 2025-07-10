import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NVDA&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );
    
    const data = await response.json();
    
    if (data.Information) {
      throw new Error('API rate limit or invalid key');
    }
    
    const quote = data['Global Quote'];
    
    if (!quote) {
      throw new Error('Invalid API response');
    }
    
    const price = parseFloat(quote['05. price']);
    const previousClose = parseFloat(quote['08. previous close']);
    const change = parseFloat(quote['09. change']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    const marketCap = (price * 24.4e9) / 1e12; // 24.4B shares
    
    return NextResponse.json({
      price,
      change,
      changePercent,
      marketCap: marketCap.toFixed(2),
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
    
  } catch (error) {
    console.error('Error fetching NVIDIA data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NVIDIA data' },
      { status: 500 }
    );
  }
}