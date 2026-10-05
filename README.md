# Alaha's

> E-commerce de joyería en Perú, con catálogo de variantes por color/talla/largo y pedidos directo por WhatsApp.

Alaha's resuelve el problema típico de vender joyería con variaciones reales (una pulsera en 3 colores, cada uno con su propio stock y precio) sin forzar al cliente a adivinar disponibilidad por chat: el catálogo muestra precio y stock exactos por combinación, el carrito respeta esos topes, y el pedido llega armado y listo por WhatsApp. Un panel administrativo cubre todo el ciclo — productos, variantes, banners, colecciones, popups y pedidos — sin tocar código.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**En producción:**
- Cliente: [alahas.vercel.app](https://alahas.vercel.app)
- API: `https://web-tienda-wsp.onrender.com`

## API pública

Endpoints de lectura/escritura pública (sin autenticación), montados bajo `https://web-tienda-wsp.onrender.com/api`. Las rutas de administración (`/api/admin/*`) requieren JWT y no se documentan aquí.

| Ruta | Descripción |
|---|---|
| `GET /health` | Estado del servidor |
| `GET /products` | Catálogo con filtros (categoría, material, color, público, grosor, tags, búsqueda, outlet) |
| `GET /products/:slug` | Detalle de un producto, con sus variantes si aplica |
| `GET /categories` | Categorías |
| `GET /materials` | Materiales |
| `GET /tags` | Tags |
| `GET /audiences` | Públicos (mujer/hombre/niño/...) |
| `GET /thicknesses` | Grosores |
| `GET /sizes` | Tallas |
| `GET /lengths` | Largos |
| `GET /colors` | Colores |
| `GET /collections` | Colecciones activas del Home |
| `GET /banners` | Banners activos del Home |
| `GET /popup` | Popup promocional activo |
| `GET /settings` | Configuración pública (moneda, WhatsApp) |
| `POST /orders` | Crear un pedido desde el carrito (rate limited) |
| `POST /contact` | Formulario de contacto (rate limited) |
| `POST /auth/login` | Login del panel admin |

## Funcionalidades

### Catálogo público

- Listado con filtros combinables: categoría, material, color, público (mujer/hombre/niño/...), grosor, tags, búsqueda por texto y rango de precio.
- **Productos con variantes**: un producto puede vender distintas combinaciones de color/talla/largo, cada una con su propio precio, descuento, stock y (opcionalmente) imagen destacada propia. La ficha preselecciona automáticamente la variante activa más barata; elegir una variante en los selectores actualiza la imagen del carrusel, y navegar la galería a mano hace el camino inverso (selecciona la variante cuya imagen coincide).
- **Outlet** como flag independiente de producto/variante (no una categoría) — un producto conserva su categoría real y además puede marcarse en Outlet; hay un filtro y un link fijo de menú dedicados.
- Carrito de compras persistente (localStorage) con una línea por combinación de producto+variante, tope de cantidad según stock real.
- Pedido se envía por WhatsApp con el detalle armado automáticamente, y queda registrado en el panel admin (`orders`/`order_items`) para seguimiento.
- Páginas institucionales: Nosotros y Marca, cada una con su propio carrusel de imágenes.
- Popup promocional configurable (imagen + texto + botón) que aparece una vez por sesión en el Home.
- Banner principal del Home: imagen única o carrusel automático si hay 2+ banners activos.
- Métricas por producto: se registran vistas de ficha y clics al botón de WhatsApp.

### Panel administrativo (`/admin`)

Autenticación JWT. Secciones:

- **Productos**: CRUD completo, hasta 6 imágenes por producto (subidas a Cloudinary, redimensionadas con Sharp), modo "con variantes" (generación de combinaciones color×talla×largo, cada una con precio/descuento/stock/imagen propios), SKU autogenerado y editable, plantilla de mensaje de WhatsApp por producto, flag Outlet a nivel producto y variante.
- **Pedidos**: ver pedidos entrantes desde el carrito web, confirmarlos (descuenta stock real) o descartarlos; también permite registrar pedidos manuales (venta fuera de la web) con precio especial por ítem.
- **Categorías, Materiales, Tags**: catálogos base de productos.
- **Atributos**: sub-catálogos de Público, Grosor, Talla, Largo y Color, usados por los filtros y por las variantes.
- **Colecciones**: secciones visuales del Home, cada una vinculada a una categoría real o marcada como la colección Outlet (enlaza a `/productos?outlet=true` en vez de a una categoría).
- **Banner Principal**: imágenes del hero del Home, con orden y activo/inactivo.
- **Popups**: configurar el popup promocional del Home.
- **Configuración**: moneda, número de WhatsApp y otros ajustes globales.

## Estructura del repositorio

```
Web-Tienda-WSP/
├── client/                     # Frontend (Vite)
│   ├── src/
│   │   ├── pages/              # Home, Productos, ProductoDetalle, Nosotros, Marca, admin/*
│   │   ├── components/         # Header, Footer, ProductCard, FiltersSidebar, CartDrawer, PopupBanner, admin/*
│   │   ├── context/             # AuthContext, CartContext
│   │   ├── hooks/                # useProducts, useProduct, useFilterCatalogs, useSettings
│   │   ├── services/api.ts      # cliente HTTP tipado hacia el backend
│   │   └── lib/                  # wa.ts (links de WhatsApp), cloudinaryUrl.ts (URLs optimizadas)
│   └── vercel.json              # rewrites SPA + cache headers
│
├── server/
│   ├── src/
│   │   ├── routes/               # products, categories, materials, tags, collections, colors,
│   │   │                          # sizes, lengths, audiences, thicknesses, banners, popup,
│   │   │                          # orders, auth, contact, settings, admin/* (CRUD protegido)
│   │   ├── services/              # productService, orderService, collectionService, bannerService,
│   │   │                          # uploadService, cloudinary.ts
│   │   ├── middleware/            # authMiddleware (JWT)
│   │   └── types/models.ts
│   └── scripts/runMigration.js   # legacy: solo aplica el schema inicial, no las migraciones 002+
│
└── database/
    ├── schema.sql                 # esquema base
    └── migrations/                # 001 a 023, SQL incremental (ver sección Migraciones)
```

## Puesta en marcha local

### Requisitos

- Node.js 18+
- PostgreSQL local, o acceso a un proyecto Supabase
- Cuenta de Cloudinary (plan gratuito alcanza)
- Cuenta de Gmail con contraseña de aplicación (para el formulario de contacto)

### 1. Clonar e instalar

```bash
git clone <repository-url>
cd Web-Tienda-WSP

cd client && npm install
cd ../server && npm install
```

### 2. Variables de entorno

Copia `server/.env.example` → `server/.env` y `client/.env.example` → `client/.env`, y completa:

**`server/.env`** — ver el propio `.env.example` para el detalle completo de cada bloque (base de datos, SMTP, JWT, Cloudinary, CORS).

**`client/.env`**:
```env
VITE_WHATSAPP_PHONE=51980656823
# VITE_API_URL vacío en desarrollo usa el proxy de Vite (/api -> localhost:3000)
```

### 3. Base de datos

El esquema base y las migraciones (001 a 023, 22 archivos) viven en `database/`. Para una base nueva:

1. Ejecuta `database/schema.sql` contra tu Postgres.
2. Ejecuta en orden cada archivo de `database/migrations/`. Son idempotentes (usan `IF NOT EXISTS`/`DROP ... IF EXISTS`), así que es seguro re-ejecutar cualquiera.

`server/scripts/runMigration.js` (`node scripts/runMigration.js`) solo cubre el schema inicial + la migración 001 — es un vestigio del setup original y **no** aplica las migraciones 002 en adelante. Hoy el flujo real es correr cada `.sql` manualmente (por ejemplo, pegándolo en el SQL Editor de Supabase).

### 4. Ejecutar en desarrollo

```bash
# Terminal 1
cd server && npm run dev      # http://localhost:3000

# Terminal 2
cd client && npm run dev      # http://localhost:5173, proxy /api -> :3000
```

### 5. Crear un usuario admin

No hay registro público ni seed de usuario admin. Inserta la fila directamente en la tabla `users` con un hash bcrypt (`role = 'admin'`):

```js
// node -e "console.log(require('bcryptjs').hashSync('tu-password', 10))"
```

```sql
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@tuempresa.com', '<hash generado arriba>', 'Administrador', 'admin');
```

## Build y despliegue

```bash
cd client && npm run build    # genera client/dist (tsc -b && vite build)
cd server && npm run build    # genera server/dist (tsc)
cd server && npm start        # corre server/dist/index.js
```

**Arquitectura en producción:**

- **Cliente** en Vercel: Root Directory `client`, Build Command `npm run build`, Output Directory `dist`. Variable `VITE_API_URL` apuntando a la URL del backend en Render.
- **Servidor** en Render: Root Directory `server`, Build Command `npm run build`, Start Command `npm start`. Variables de entorno según `server/.env.example`, más `CORS_ORIGIN` con el dominio de Vercel.
- **Base de datos**: Supabase (Postgres administrado). Las migraciones se corren manualmente en su SQL Editor.
- **Imágenes**: Cloudinary (no hay almacenamiento en filesystem del servidor; Render tiene filesystem efímero, así que esto es obligatorio, no una opción).

Render free tier "duerme" el backend tras un período sin tráfico (cold start de varios segundos en la primera visita). Si esto es un problema, un monitor externo tipo UptimeRobot pegándole a `GET /api/health` cada 5 minutos lo mantiene despierto.

## Seguridad

- Helmet (headers HTTP), CORS con orígenes explícitos en producción.
- JWT con expiración configurable (`JWT_EXPIRES_IN`), passwords con bcrypt.
- Validación de entrada con Zod en cada ruta que recibe datos.
- Queries parametrizadas (`pg`), sin concatenación de SQL.
- Rate limiting en el formulario de contacto.

Antes de un despliegue nuevo: `JWT_SECRET` propio (no el de ejemplo), `CORS_ORIGIN` con el dominio real, `NODE_ENV=production`, credenciales de Cloudinary/SMTP propias.

## Licencia

Proyecto privado.
