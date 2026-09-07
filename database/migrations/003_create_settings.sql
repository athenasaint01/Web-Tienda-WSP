CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valores iniciales
INSERT INTO settings (key, value) VALUES ('whatsapp_phone', '51980656823') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('facebook_url', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('instagram_url', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('tiktok_url', '') ON CONFLICT (key) DO NOTHING;
