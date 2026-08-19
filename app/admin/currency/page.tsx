'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// NOTE: this page assumes it's already behind your admin auth/middleware.
// If you don't have that yet, protect this route (e.g. in middleware.ts) so only
// users with profiles.is_admin = true can reach /admin/*.

export default function CurrencyAdminPage() {
  const [rate, setRate] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('currency_settings')
        .select('usd_to_inr_rate, updated_at')
        .eq('id', 1)
        .single();

      if (data) {
        setRate(String(data.usd_to_inr_rate));
        setUpdatedAt(data.updated_at);
      }
    }
    load();
  }, []);

  async function handleSave() {
    const parsed = parseFloat(rate);
    if (!parsed || parsed <= 0) {
      setMessage('Enter a valid rate greater than 0.');
      return;
    }

    setSaving(true);
    setMessage('');

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('currency_settings')
      .update({
        usd_to_inr_rate: parsed,
        updated_at: new Date().toISOString(),
        updated_by: userData?.user?.id,
      })
      .eq('id', 1);

    setSaving(false);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Rate updated — all product prices on the storefront now reflect it.');
      setUpdatedAt(new Date().toISOString());
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-1">Currency rate</h1>
      <p className="text-sm text-gray-500 mb-4">
        Set the manual USD/INR conversion rate used across the storefront.
      </p>

      <label className="block text-sm text-gray-600 mb-1">1 USD = ? INR</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        className="border rounded-md px-3 py-2 w-full mb-3"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save rate'}
      </button>

      {message && <p className="mt-3 text-sm">{message}</p>}
      {updatedAt && (
        <p className="mt-2 text-xs text-gray-400">
          Last updated: {new Date(updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
