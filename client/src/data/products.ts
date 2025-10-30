export type Product = {
  id: string;
  slug: string;
  name: string;
  category: 'collares' | 'pulseras' | 'anillos' | 'otros';
  images: string[];
  featured?: boolean;
  waTemplate?: string;
  description?: string;
  materials?: string[];
  tags?: string[];
};

export const products: Product[] = [
  {
    id: 'p1',
    slug: 'collar-aurora',
    name: "Collar Aurora",
    category: 'collares',
    images: ['/assets/collar.png'],
    featured: true,
    materials: ['acero', 'baño de oro'],
    tags: ['minimal', 'diario'],
    description: 'Collar tipo media luna, liviano e hipoalergénico.',
    waTemplate: 'Hola, me interesa el Collar Aurora. ¿Está disponible?',
  },
  {
    id: 'p2',
    slug: 'pulsera-luna',
    name: 'Pulsera Luna',
    category: 'pulseras',
    images: ['/assets/pulsera.png'],
    featured: true,
    materials: ['acero'],
    tags: ['luna', 'charms'],
    description: 'Pulsera con dije de luna en acabado satinado.',
  },
  {
    id: 'p3',
    slug: 'anillo-sol',
    name: 'Anillo Sol',
    category: 'anillos',
    images: ['/assets/anillo.png'],
    featured: true,
    materials: ['acero', 'baño de oro'],
    tags: ['statement'],
    description: 'Anillo Sol con centro dorado y rayos texturizados.',
  },
  {
    id: 'p4',
    slug: 'pulsera-trenzada',
    name: 'Pulsera Trenzada',
    category: 'pulseras',
    images: ['/assets/pulsera.png'],
    materials: ['acero'],
    tags: ['trenzado', 'clásico'],
    description: 'Trama trenzada con brillo sutil.',
  },
  {
    id: 'p5',
    slug: 'collar-cadena-fina',
    name: 'Collar Cadena Fina',
    category: 'collares',
    images: ['/assets/collar.png'],
    materials: ['acero'],
    tags: ['layering', 'básico'],
    description: 'Ideal para combinar en capas.',
  },
  {
    id: 'p6',
    slug: 'anillo-corona',
    name: 'Anillo Corona',
    category: 'anillos',
    images: ['/assets/anillo.png'],
    materials: ['acero'],
    tags: ['icónico'],
    description: 'Anillo con corona, guiño al logo de la marca.',
  },
];

export const featuredProducts = products.filter(p => p.featured);
