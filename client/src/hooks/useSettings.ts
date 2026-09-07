import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

type Settings = Record<string, string>;

let cache: Settings | null = null;
let promise: Promise<Settings> | null = null;

export function invalidateSettingsCache() {
  cache = null;
  promise = null;
}

const fetchSettings = (): Promise<Settings> => {
  if (cache) return Promise.resolve(cache);
  if (promise) return promise;
  promise = fetch(`${API}/settings`)
    .then(r => r.json())
    .then(data => {
      cache = data.ok ? data.data : {};
      return cache as Settings;
    })
    .catch(() => {
      cache = {};
      return cache as Settings;
    });
  return promise;
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(cache ?? {});
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    fetchSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  return { settings, loading };
}

// Helper para obtener el número de WhatsApp con fallback al .env
export function useWhatsAppPhone(): string {
  const { settings } = useSettings();
  return settings['whatsapp_phone'] || import.meta.env.VITE_WHATSAPP_PHONE || '';
}

// Retorna true si WhatsApp está habilitado globalmente (default: true si el setting no existe)
export function useWhatsAppEnabled(): boolean {
  const { settings, loading } = useSettings();
  if (loading) return false;
  const val = settings['whatsapp_enabled'];
  if (val === undefined) return true;
  return val === 'true';
}

// Símbolo de moneda configurable (default 'S/')
export function useCurrency(): string {
  const { settings } = useSettings();
  return settings['currency_symbol'] || 'S/';
}

/**
 * Formatea un monto con el símbolo de moneda.
 * Ej: formatPrice(129.9, 'S/') -> "S/ 129.90"
 *     formatPrice(120, 'S/')   -> "S/ 120"
 */
export function formatPrice(amount: number | null | undefined, symbol: string): string {
  if (amount == null || isNaN(amount)) return '';
  const hasDecimals = Math.round(amount * 100) % 100 !== 0;
  const value = hasDecimals ? amount.toFixed(2) : String(Math.round(amount));
  return `${symbol} ${value}`;
}
