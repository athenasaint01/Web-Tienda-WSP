/**
 * Inserta una transformación de Cloudinary al vuelo (sin re-subir nada) en
 * una URL ya existente. Sirve la imagen ya redimensionada para el ancho
 * real en pantalla, en el mejor formato que soporte el navegador (WebP/
 * AVIF) y con la calidad óptima -- en vez de siempre entregar la versión
 * completa de 1200px subida al crear el producto/banner.
 *
 * Ej: https://res.cloudinary.com/x/image/upload/v123/a/b.jpg
 *  -> https://res.cloudinary.com/x/image/upload/w_800,f_auto,q_auto/v123/a/b.jpg
 *
 * URLs que no son de Cloudinary (u otro origen) se devuelven sin tocar.
 */
export const cloudinaryOptimized = (url: string | null | undefined, width: number): string => {
  if (!url) return '';
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (!url.includes('res.cloudinary.com') || idx === -1) return url;

  const insertAt = idx + marker.length;
  return `${url.slice(0, insertAt)}w_${width},f_auto,q_auto/${url.slice(insertAt)}`;
};
