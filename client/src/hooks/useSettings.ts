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
