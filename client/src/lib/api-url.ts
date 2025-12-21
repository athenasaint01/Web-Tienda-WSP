/**
 * Obtiene la URL base del API desde las variables de entorno
 * En producción usa Railway, en desarrollo usa el proxy local
 */
export const getApiUrl = (path: string = ''): string => {
  const baseUrl = import.meta.env.VITE_API_URL || '/api';

  // Si el path ya incluye /api, no duplicarlo
  if (path.startsWith('/api')) {
    return `${baseUrl}${path.replace('/api', '')}`;
  }

  // Si el path no empieza con /, agregarlo
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
};
