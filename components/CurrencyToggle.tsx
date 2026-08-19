'use client';

import { useCurrency } from '@/lib/currency/CurrencyProvider';

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="inline-flex rounded-lg border border-gray-200 p-1">
      <button
        onClick={() => setCurrency('INR')}
        aria-pressed={currency === 'INR'}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          currency === 'INR' ? 'bg-black text-white' : 'text-gray-600'
        }`}
      >
        ₹ INR
      </button>
      <button
        onClick={() => setCurrency('USD')}
        aria-pressed={currency === 'USD'}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          currency === 'USD' ? 'bg-black text-white' : 'text-gray-600'
        }`}
      >
        US$
      </button>
    </div>
  );
}
