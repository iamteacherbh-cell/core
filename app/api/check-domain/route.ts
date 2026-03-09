import { NextResponse } from 'next/server';
import { CURRENCIES, type CurrencyCode } from '@/lib/constants/currencies';

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

    const apiKey = process.env.GODADDY_API_KEY;
    const apiSecret = process.env.GODADDY_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'API credentials not configured' },
        { status: 500 }
      );
    }

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

    if (data.available && data.price) {
      const priceInUSD = data.price / 1000000;
      const doubledPriceUSD = priceInUSD * 2;
      const convertedPrice = doubledPriceUSD * CURRENCIES[currency].rate;
      
      return NextResponse.json({
        available: true,
        domain: data.domain,
        price: {
          value: Math.round(convertedPrice * 100) / 100,
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
  const isArabicCurrency = ['SAR', 'AED', 'KWD', 'QAR', 'BHD'].includes(currency);
  
  if (isArabicCurrency) {
    return `${price.toFixed(2)} ${symbol}`;
  }
  
  return `${symbol}${price.toFixed(2)}`;
}
