# Web Alahas - Joyería Artesanal

E-commerce full-stack para joyería artesanal de alta gama con catálogo dinámico, panel administrativo, sistema de inventario y integración con WhatsApp.

## 🚀 Características

### ✨ Funcionalidades del Cliente

- **Catálogo Dinámico**: Productos cargados desde base de datos PostgreSQL
- **Filtrado Avanzado**: Búsqueda por texto, categoría, materiales y tags
- **Animaciones Premium**: Efectos de entrada suaves con Framer Motion
- **Tarjetas 3D Interactivas**: Rotación basada en posición del mouse
- **Galería de Productos**: Múltiples imágenes con zoom hover
- **Sistema de Colecciones**: Secciones destacadas en home page
- **Integración WhatsApp**: Contacto directo con mensajes personalizados
- **Control de Stock**: Badges "AGOTADO" para productos sin inventario
- **Diseño Responsivo**: Optimizado para móvil, tablet y desktop
- **SEO Optimizado**: URLs limpias, meta tags dinámicos

### 🔐 Panel Administrativo

- **Autenticación JWT**: Login seguro con tokens de 7 días
- **CRUD Completo de Productos**:
  - Upload múltiple de imágenes (hasta 6 por producto)
  - Procesamiento automático a 3 tamaños (thumbnail, medium, large)
  - Gestión de stock y umbral de bajo inventario
  - Asignación de materiales y tags
  - Templates personalizados para WhatsApp
- **Gestión de Taxonomía**:
  - Categorías con slug automático
  - Materiales reutilizables
  - Tags para filtrado avanzado
- **Gestión de Colecciones**:
  - Asociación categoría + imagen
  - Orden personalizado para home page
  - Activación/desactivación dinámica

## 📋 Requisitos Previos

- **Node.js** 18+ y npm
- **PostgreSQL** 14+ (local o Railway/Neon/Supabase)
- **Gmail** con contraseña de aplicación (para emails)
- **WhatsApp Business** (opcional, para integración)

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd Web-Tienda-WSP
```

### 2. Instalar dependencias

```bash
# Cliente
cd client
npm install

# Servidor
cd ../server
npm install
```

### 3. Configurar variables de entorno

**Cliente (`client/.env`):**
```env
VITE_WHATSAPP_PHONE=51980656823
# En desarrollo: déjalo vacío para usar proxy de Vite
# En producción: URL del backend
# VITE_API_URL=https://tu-backend.railway.app
```

**Servidor (`server/.env`):**
```env
# Puerto
PORT=3000

# Base de datos (elige una opción)
# Opción 1: URL completa (Railway/Render)
DATABASE_URL=postgresql://usuario:password@host:puerto/database

# Opción 2: Variables individuales (desarrollo local)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=nombre_bd
# DB_USER=postgres
# DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion
JWT_EXPIRES_IN=7d

# SMTP / Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-de-16-digitos
MAIL_FROM="Tu Negocio <tu-email@gmail.com>"
MAIL_TO=destinatario@example.com

# CORS (solo en producción)
# CORS_ORIGIN=https://tu-app.vercel.app,https://www.tu-dominio.com

# Entorno
NODE_ENV=development
```

### 4. Configurar base de datos

```bash
cd server

# Ejecutar migraciones
node scripts/runMigration.js
```

Esto creará:
- Tablas: `products`, `categories`, `materials`, `tags`, `collections`, `users`, etc.
- Datos de ejemplo (2 productos por categoría)
- Usuario admin por defecto

### 5. Crear usuario administrador

```bash
cd server
npm run dev
```

Luego hacer POST a `/api/dev/fix-admin` (solo en desarrollo) o ejecutar SQL:

```sql
-- Genera hash con bcryptjs para password "admin123"
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'admin@tuempresa.com',
  '$2a$10$tu_hash_bcrypt_aqui',
  'Administrador',
  'admin'
);
```

## 🏃 Ejecución en Desarrollo

### Opción 1: Servidores separados (recomendado)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Servidor en http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Cliente en http://localhost:5173
```

El proxy de Vite redirige `/api/*` → `http://localhost:3000`

### Opción 2: Script concurrente (requiere package.json raíz)

```bash
npm run dev
```

## 📦 Build para Producción

### Compilar Cliente

```bash
cd client
npm run build
# Genera archivos estáticos en client/dist/
```

### Compilar Servidor

```bash
cd server
npm run build
# Compila TypeScript a JavaScript en server/dist/
```

### Ejecutar en Producción

```bash
cd server
npm start
# Ejecuta desde dist/ con NODE_ENV=production
```

## 🗂️ Estructura del Proyecto

```
Web-Tienda-WSP/
├── client/                           # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Página principal con colecciones
│   │   │   ├── Productos.tsx         # Catálogo con filtros y paginación
│   │   │   ├── ProductoDetalle.tsx   # Detalle del producto
│   │   │   ├── Nosotros.tsx          # Sobre la empresa
│   │   │   └── admin/                # Panel administrativo
│   │   │       ├── Dashboard.tsx     # Vista principal admin
│   │   │       ├── Login.tsx         # Autenticación
│   │   │       ├── productos/        # CRUD productos
│   │   │       ├── categorias/       # Gestión categorías
│   │   │       ├── materiales/       # Gestión materiales
│   │   │       ├── tags/             # Gestión tags
│   │   │       └── colecciones/      # Gestión colecciones
│   │   ├── components/
│   │   │   ├── Layout.tsx            # Layout público
│   │   │   ├── Header.tsx            # Navegación con scroll-to-top
│   │   │   ├── ProductCard.tsx       # Tarjeta 3D con animaciones
│   │   │   ├── FiltersSidebar.tsx    # Filtros memoizados
│   │   │   └── admin/                # Componentes admin
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # Gestión de autenticación
│   │   ├── hooks/
│   │   │   ├── useProduct.ts         # Hook para productos
│   │   │   └── useFilters.ts         # Hook para filtros
│   │   ├── services/
│   │   │   └── api.ts                # Cliente API con tipos
│   │   ├── lib/
│   │   │   └── wa.ts                 # Generador links WhatsApp
│   │   └── types/
│   │       └── api.ts                # Tipos TypeScript compartidos
│   ├── public/                       # Assets estáticos
│   ├── vercel.json                   # Config SPA routing Vercel
│   └── .env.example                  # Template variables entorno
│
├── server/                           # Backend Express
│   ├── src/
│   │   ├── index.ts                  # Entry point con middleware
│   │   ├── config/
│   │   │   └── database.ts           # Pool PostgreSQL + SSL
│   │   ├── routes/
│   │   │   ├── contact.ts            # Formulario contacto
│   │   │   ├── auth.ts               # Login/registro
│   │   │   ├── products.ts           # Productos públicos
│   │   │   ├── categories.ts         # Categorías públicas
│   │   │   ├── materials.ts          # Materiales públicos
│   │   │   ├── tags.ts               # Tags públicos
│   │   │   ├── collections.ts        # Colecciones públicas
│   │   │   └── admin/                # Rutas protegidas
│   │   │       ├── products.ts       # CRUD productos
│   │   │       ├── categories.ts     # CRUD categorías
│   │   │       ├── materials.ts      # CRUD materiales
│   │   │       ├── tags.ts           # CRUD tags
│   │   │       └── collections.ts    # CRUD colecciones
│   │   ├── services/
│   │   │   ├── productService.ts     # Lógica de negocio productos
│   │   │   └── uploadService.ts      # Procesamiento imágenes (Sharp)
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts     # JWT verification
│   │   ├── types/
│   │   │   └── models.ts             # Tipos TypeScript
│   │   ├── email.ts                  # Nodemailer config
│   │   └── scripts/
│   │       └── generateHash.ts       # Generar passwords bcrypt
│   ├── scripts/
│   │   └── runMigration.js           # Script migraciones DB
│   ├── database/
│   │   ├── schema.sql                # Esquema principal
│   │   ├── seed.sql                  # Datos iniciales
│   │   ├── EJECUTAR_EN_PGADMIN.sql   # Collections + ejemplos
│   │   └── migrations/               # Migraciones incrementales
│   ├── uploads/                      # Imágenes subidas (gitignored)
│   │   └── products/
│   │       ├── thumbnails/           # 200x200px
│   │       ├── medium/               # 600x600px
│   │       └── large/                # 1200x1200px
│   ├── dist/                         # Build compilado
│   └── .env.example                  # Template variables entorno
│
├── database/                         # SQL compartidos
└── README.md
```

## 🎨 Stack Tecnológico

### Frontend
- **React 19.2.2** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 7** - Build tool + HMR
- **React Router DOM 7** - Client-side routing
- **TailwindCSS 3** - Utility-first CSS
- **Framer Motion 12** - Advanced animations
- **Lucide React** - Modern icons
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Express 5** - Web framework
- **TypeScript 5.9** - Type safety
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client with connection pooling
- **Nodemailer 7** - Email sending
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Multer** - Multipart/form-data handling
- **Sharp** - Image processing (resize, optimize)
- **Helmet** - Security headers
- **CORS** - Cross-origin control
- **express-rate-limit** - Rate limiting

## 🔧 Guías de Uso

### Añadir Productos desde el Admin

1. Inicia sesión en `/admin`
2. Ve a "Productos" → "Nuevo Producto"
3. Completa:
   - **Slug**: URL amigable (auto-normalizado a lowercase-kebab-case)
   - **Nombre**: Título del producto
   - **Categoría**: Selecciona de la lista
   - **Stock**: Cantidad disponible
   - **Umbral bajo stock**: Cuándo mostrar advertencia
   - **Destacado**: Aparecerá en home
   - **Template WhatsApp**: Usa `{nombre}` como placeholder
4. Sube hasta 6 imágenes (se procesan automáticamente)
5. Asigna materiales y tags

### Gestionar Colecciones (Home Page)

Las colecciones son secciones visuales en el home:

1. Ve a "Colecciones" en el admin
2. Cada categoría puede tener UNA colección activa
3. Sube una imagen representativa (1200x800px recomendado)
4. Ajusta el orden de visualización
5. Activa/desactiva para mostrar/ocultar

### Personalizar Estilos

**Colores (`client/src/index.css`):**
```css
:root {
  --color-primary: #tu-color;
  --color-secondary: #tu-color;
}
```

**Fuentes (`client/tailwind.config.js`):**
```javascript
fontFamily: {
  'heading': ['Tu-Fuente', 'serif'],
  'body': ['Tu-Fuente', 'sans-serif'],
}
```

### Rate Limiting del Formulario

Ajusta en `server/src/routes/contact.ts`:

```typescript
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // Ventana de tiempo
  max: 5,                     // Máximo de requests
  message: "Mensaje personalizado..."
})
```

## 🚀 Deployment

### Arquitectura Recomendada

- **Frontend**: Vercel (SPA estático)
- **Backend**: Railway (Node.js + PostgreSQL)
- **Base de Datos**: Railway PostgreSQL (incluido)
- **Imágenes**: Almacenamiento persistente en Railway

### Paso 1: Deploy Backend en Railway

1. **Crear cuenta en Railway** (railway.app)
2. **Nuevo Proyecto** → "Deploy from GitHub repo"
3. **Seleccionar repositorio** y rama `main`
4. Railway detectará automáticamente el monorepo
5. **Configurar Root Directory**: `server`
6. **Agregar PostgreSQL** desde "New" → "Database" → "PostgreSQL"
7. **Configurar Variables de Entorno**:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-inyectada por Railway
NODE_ENV=production
PORT=3000
JWT_SECRET=genera-un-secreto-aleatorio-seguro-de-64-caracteres
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
MAIL_FROM="Tu Negocio <tu-email@gmail.com>"
MAIL_TO=destinatario@example.com
CORS_ORIGIN=https://tu-app.vercel.app
```

8. **Deploy automático** - Railway ejecutará:
   - `npm install`
   - `npm run build`
   - `npm start`

9. **Ejecutar migraciones** (solo primera vez):
   - Ve a "Settings" → "Deploy Triggers"
   - Agrega comando: `node scripts/runMigration.js`
   - O ejecuta manualmente desde Railway CLI

10. **Copiar URL del backend**: `https://tu-proyecto.up.railway.app`

### Paso 2: Deploy Frontend en Vercel

1. **Crear cuenta en Vercel** (vercel.com)
2. **Import Git Repository**
3. **Configurar proyecto**:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:

```env
VITE_API_URL=https://tu-proyecto.up.railway.app
VITE_WHATSAPP_PHONE=51980656823
```

5. **Deploy** - Vercel construirá automáticamente

### Paso 3: Actualizar CORS en Railway

Una vez que Vercel te dé tu URL (`https://tu-app.vercel.app`):

1. Ve a Railway → Variables de Entorno
2. Actualiza `CORS_ORIGIN`:
```env
CORS_ORIGIN=https://tu-app.vercel.app,https://www.tu-dominio.com
```
3. Railway redeplegará automáticamente

### Alternativa: VPS/Servidor Propio

```bash
# Instalar PM2
npm install -g pm2

# Build
cd client && npm run build
cd ../server && npm run build

# Servir cliente con Nginx/Apache
# Copiar client/dist/ a /var/www/html

# Ejecutar backend con PM2
cd server
pm2 start dist/index.js --name api-alahas
pm2 save
pm2 startup
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Upload de imágenes
    location /uploads {
        proxy_pass http://localhost:3000;
    }
}
```

## 🔐 Seguridad

### Implementaciones Actuales

- ✅ **Helmet** - Headers HTTP seguros
- ✅ **CORS** - Control de orígenes permitidos
- ✅ **JWT** - Autenticación stateless con expiración
- ✅ **bcryptjs** - Hashing seguro de passwords (salt rounds: 10)
- ✅ **Zod** - Validación estricta de entrada
- ✅ **Rate Limiting** - Protección contra spam (5 req/10min)
- ✅ **SQL Parameterizado** - Prevención de SQL injection
- ✅ **SSL/TLS** - Conexión cifrada a PostgreSQL en producción
- ✅ **Variables de entorno** - Secretos fuera del código

### Checklist Pre-Producción

- [ ] Cambiar `JWT_SECRET` a valor aleatorio de 64+ caracteres
- [ ] Usar contraseña de aplicación Gmail (no password principal)
- [ ] Configurar `CORS_ORIGIN` con dominio real
- [ ] Establecer `NODE_ENV=production`
- [ ] Activar HTTPS/SSL en servidor
- [ ] Revisar permisos de usuario PostgreSQL
- [ ] Configurar backups automáticos de BD
- [ ] Implementar rotación de logs

## 🐛 Troubleshooting

### Error: "Cannot connect to PostgreSQL"

**Causa**: Configuración incorrecta de `DATABASE_URL`

**Solución**:
```bash
# Verificar formato
postgresql://usuario:password@host:puerto/database

# Probar conexión
psql "postgresql://..."

# En Railway, usar la URL auto-generada
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Error: "SASL: client password must be a string"

**Causa**: `DATABASE_URL` no se está leyendo correctamente

**Solución**:
```bash
# Recompilar servidor
cd server
npm run build

# Verificar .env existe y tiene DATABASE_URL
cat .env | grep DATABASE_URL
```

### Formulario de contacto no envía emails

**Gmail con 2FA**:
1. Ve a cuenta.google.com → Seguridad
2. Habilita "Verificación en 2 pasos"
3. Genera "Contraseña de aplicación" (16 dígitos sin espacios)
4. Usa esa password en `SMTP_PASS`

### Imágenes no se suben en producción

**Railway/Render**: El sistema de archivos es efímero

**Soluciones**:
1. Usar servicio de almacenamiento (AWS S3, Cloudinary, etc.)
2. Modificar `uploadService.ts` para subir a CDN
3. Usar Railway Volumes (persistente pero limitado)

### Error de CORS en producción

**Síntoma**: `Access-Control-Allow-Origin` error

**Solución**:
```typescript
// server/src/index.ts
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

Verifica que `CORS_ORIGIN` en Railway incluya tu dominio Vercel.

### Build falla con errores TypeScript

**Síntoma**: `npm run build` muestra errores de tipos

**Solución**:
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json dist
npm install
npm run build

# Si persiste, revisar tipos importados
# Usar 'import type' para tipos
import type { User } from './types'
```

## 📈 Roadmap

### ✅ Completado (v1.0)
- [x] Catálogo dinámico con PostgreSQL
- [x] Panel administrativo completo
- [x] Sistema de autenticación JWT
- [x] Upload y procesamiento de imágenes
- [x] Control de inventario y stock
- [x] Gestión de colecciones
- [x] Animaciones y UX premium
- [x] Deployment en Railway + Vercel

### 🚧 En Progreso (v1.1)
- [ ] Dashboard con métricas (productos más vistos, stock bajo)
- [ ] Búsqueda con Algolia/ElasticSearch
- [ ] Integración WhatsApp Business API
- [ ] Newsletter con Mailchimp

### 📅 Planificado (v2.0)
- [ ] Carrito de compras persistente
- [ ] Wishlist/Favoritos
- [ ] Sistema de reviews y ratings
- [ ] Pasarela de pagos (Stripe/MercadoPago)
- [ ] Multi-idioma (i18n)
- [ ] PWA con notificaciones push
- [ ] Tests E2E con Playwright

## 📄 Licencia

Este proyecto es privado y propietario.

## 👥 Contribuciones

Para contribuir:
1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'feat: descripción'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📞 Soporte

Para reportar bugs o solicitar features:
- **Issues**: Abre un issue en GitHub
- **Email**: soporte@tuempresa.com
- **WhatsApp**: +51 980 656 823

## 👤 Autor

**Diego Nancay**
- GitHub: [@athenasaint01](https://github.com/athenasaint01)
- LinkedIn: [Diego Nancay](https://linkedin.com/in/diego-nancay)

---

Desarrollado con ❤️ usando React, TypeScript y PostgreSQL
