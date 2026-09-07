-- Add whatsapp_enabled setting (default: true)
INSERT INTO settings (key, value)
VALUES ('whatsapp_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
