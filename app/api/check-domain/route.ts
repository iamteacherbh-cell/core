import { NextResponse } from 'next/server';

// Currency configuration
const CURRENCIES = {
  USD: { symbol: '$', rate: 1 },
  SAR: { symbol: '﷼', rate: 3.75 }, // Saudi Riyal
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.79 },
  AED: { symbol: 'د.إ', rate: 3.67 },
  KWD: { symbol: 'د.ك', rate: 0.31 },
  QAR: { symbol: '﷼', rate: 3.64 },
  BHD: { symbol: '.د.ب', rate: 0.38 }
} as const;

type CurrencyCode = keyof typeof CURRENCIES;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const currency = (searchParams.get('currency') || 'USD') as CurrencyCode;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Your GoDaddy API credentials from environment variables
    const apiKey = process.env.GODADDY_API_KEY;
    const apiSecret = process.env.GODADDY_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'API credentials not configured' },
        { status: 500 }
      );
    }

    // Call GoDaddy OTE API (test environment)
    const url = `https://api.ote-godaddy.com/v1/domains/available?domain=${encodeURIComponent(domain)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `sso-key ${apiKey}:${apiSecret}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'API request failed' },
        { status: response.status }
      );
    }

    // Process the response with currency conversion
    if (data.available && data.price) {
      // Convert price from micros to actual currency
      const priceInUSD = data.price / 1000000;
      
      // Double the price for testing (remove in production)
      const doubledPriceUSD = priceInUSD * 2;
      
      // Convert to requested currency
      const convertedPrice = doubledPriceUSD * CURRENCIES[currency].rate;
      
      return NextResponse.json({
        available: true,
        domain: data.domain,
        price: {
          value: Math.round(convertedPrice * 100) / 100, // Round to 2 decimals
          currency,
          symbol: CURRENCIES[currency].symbol,
          formatted: formatPrice(convertedPrice, currency)
        },
        original: {
          price: priceInUSD,
          currency: 'USD'
        }
      });
    }

    return NextResponse.json({
      available: false,
      domain: data.domain
    });

  } catch (error) {
    console.error('Domain check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatPrice(price: number, currency: CurrencyCode): string {
  const { symbol } = CURRENCIES[currency];
  
  // Arabic currencies usually show symbol on the left
  const isArabicCurrency = ['SAR', 'AED', 'KWD', 'QAR', 'BHD'].includes(currency);
  
  if (isArabicCurrency) {
    return `${price.toFixed(2)} ${symbol}`;
  }
  
  return `${symbol}${price.toFixed(2)}`;
}
