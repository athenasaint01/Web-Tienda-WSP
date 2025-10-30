# Web Alahas - Joyería Artesanal

Sitio web de comercio electrónico para joyería artesanal de alta gama, con catálogo de productos, filtros avanzados, animaciones 3D y integración con WhatsApp.

## 🚀 Características

### Funcionalidades Actuales

- **Catálogo de Productos**: Visualización de collares, pulseras, anillos y otros productos
- **Filtrado Avanzado**: Búsqueda por texto, categoría y ordenamiento múltiple
- **Galería Interactiva**: Carruseles automáticos con efectos de transición suaves
- **Tarjetas 3D**: Efecto de rotación 3D en las tarjetas de productos basado en la posición del mouse
- **Detalle de Producto**: Galería de imágenes con zoom al pasar el cursor
- **Integración WhatsApp**: Botones de contacto directo con mensajes pre-configurados
- **Formulario de Contacto**: Envío de consultas vía email con validación y rate limiting
- **Diseño Responsivo**: Optimizado para dispositivos móviles, tablets y desktop
- **Animaciones Fluidas**: Implementadas con Framer Motion para una experiencia premium
- **SEO-Friendly**: URLs limpias con slugs descriptivos

### 🚧 En Desarrollo

- **Panel Administrativo**: Gestión de productos, categorías y configuración (próximamente)
- **Sistema de Autenticación**: Control de acceso para administradores
- **Gestión de Inventario**: CRUD completo de productos con upload de imágenes
- **Analytics Dashboard**: Métricas de visitas, productos más vistos, conversiones

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Gmail con contraseña de aplicación (para envío de emails)
- Número de WhatsApp Business (opcional, para integración de contacto)

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd "Web Alahas"
```

### 2. Instalar dependencias del cliente

```bash
cd client
npm install
```

### 3. Instalar dependencias del servidor

```bash
cd ../server
npm install
```

### 4. Configurar variables de entorno

**Cliente** (`client/.env`):
```env
VITE_WHATSAPP_PHONE=51980656823
```

**Servidor** (`server/.env`):
```env
PORT=3000

# Configuración SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Configuración de emails
MAIL_FROM="Web Alahas <tu-email@gmail.com>"
MAIL_TO=receptor@gmail.com
```

> **Nota**: Para Gmail, debes generar una "contraseña de aplicación" desde tu cuenta de Google. No uses tu contraseña regular.

## 🏃‍♂️ Ejecución en Desarrollo

### Opción 1: Ejecutar ambos servidores manualmente

**Terminal 1 - Cliente:**
```bash
cd client
npm run dev
```
El cliente estará disponible en: http://localhost:5173

**Terminal 2 - Servidor:**
```bash
cd server
npm run dev
```
El servidor estará disponible en: http://localhost:3000

### Opción 2: Script de desarrollo (recomendado)

```bash
# Desde la raíz del proyecto
npm run dev
```

> El cliente automáticamente redirige las peticiones `/api/*` al servidor gracias al proxy de Vite.

## 📦 Build para Producción

### Cliente

```bash
cd client
npm run build
```

Genera los archivos estáticos en `client/dist/`

### Servidor

```bash
cd server
npm run build
```

Compila TypeScript a JavaScript en `server/dist/`

### Iniciar en producción

```bash
cd server
npm start
```

## 🗂️ Estructura del Proyecto

```
Web Alahas/
├── client/                    # Aplicación React
│   ├── src/
│   │   ├── pages/            # Páginas de rutas
│   │   │   ├── Home.tsx      # Página principal
│   │   │   ├── Productos.tsx # Listado con filtros
│   │   │   ├── ProductoDetalle.tsx
│   │   │   └── Nosotros.tsx  # Acerca de nosotros
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── Layout.tsx    # Layout principal
│   │   │   ├── Header.tsx    # Navegación
│   │   │   ├── Footer.tsx
│   │   │   ├── ProductCard.tsx  # Tarjeta de producto con 3D
│   │   │   ├── FiltersSidebar.tsx
│   │   │   └── ui/           # Componentes UI base
│   │   ├── data/
│   │   │   └── products.ts   # Catálogo de productos
│   │   ├── lib/
│   │   │   └── wa.ts         # Utilidad WhatsApp
│   │   ├── assets/           # Imágenes y recursos
│   │   └── App.tsx           # Configuración de rutas
│   ├── public/               # Archivos estáticos
│   ├── index.html
│   ├── vite.config.ts        # Configuración Vite
│   └── tailwind.config.js    # Configuración Tailwind
│
├── server/                   # API Express
│   ├── src/
│   │   ├── index.ts         # Punto de entrada
│   │   ├── routes/
│   │   │   └── contact.ts   # Endpoint de contacto
│   │   └── email.ts         # Configuración Nodemailer
│   └── dist/                # Build compilado
│
└── README.md
```

## 🎨 Stack Tecnológico

### Frontend

- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript 5.8** - Tipado estático
- **Vite 7** - Build tool y dev server
- **React Router DOM 7** - Enrutamiento del lado del cliente
- **TailwindCSS 3** - Framework CSS utility-first
- **Framer Motion 12** - Animaciones avanzadas
- **Lucide React** - Iconos modernos
- **React Day Picker** - Selector de fechas
- **date-fns** - Manipulación de fechas

### Backend

- **Express 5** - Framework web para Node.js
- **TypeScript 5.9** - Tipado estático
- **Nodemailer 7** - Envío de emails
- **Zod 4** - Validación de esquemas
- **Helmet** - Seguridad HTTP
- **CORS** - Control de origen cruzado
- **express-rate-limit** - Limitación de peticiones

## 🔧 Configuración Adicional

### Añadir Nuevos Productos

Edita el archivo `client/src/data/products.ts`:

```typescript
{
  id: "unique-id",
  slug: "url-friendly-name",
  name: "Nombre del Producto",
  category: "collares", // 'collares' | 'pulseras' | 'anillos' | 'otros'
  images: ["/ruta/imagen1.jpg", "/ruta/imagen2.jpg"],
  featured: true, // Aparece en página principal
  waTemplate: "Hola, me interesa el {nombre}",
  description: "Descripción detallada del producto...",
  materials: ["Oro 18k", "Diamantes"],
  tags: ["elegante", "moderno"]
}
```

### Personalizar Colores y Estilos

Modifica `client/tailwind.config.js`:

```javascript
export default {
  theme: {
    extend: {
      colors: {
        primary: '#tu-color-primario',
        secondary: '#tu-color-secundario',
      },
      fontFamily: {
        'heading': ['Tu-Fuente-Personalizada', 'serif'],
      }
    }
  }
}
```

### Configurar Rate Limiting

Ajusta en `server/src/routes/contact.ts`:

```typescript
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // 5 peticiones por ventana
  message: "Demasiadas solicitudes..."
})
```

## 🔐 Seguridad

- ✅ Headers de seguridad con Helmet
- ✅ Validación de entrada con Zod
- ✅ Rate limiting en formulario de contacto
- ✅ CORS configurado
- ✅ Variables de entorno para secretos
- ⚠️ HTTPS requerido en producción
- ⚠️ Actualizar CORS origins antes de deployment

## 📱 Integración WhatsApp

El botón de WhatsApp genera links con mensajes pre-configurados:

```typescript
import { waLink } from '@/lib/wa'

// Mensaje genérico
<a href={waLink("Hola, tengo una consulta")}>Contactar</a>

// Mensaje específico de producto
<a href={waLink(product.waTemplate?.replace('{nombre}', product.name))}>
  Consultar
</a>
```

El número se configura en `client/.env` como `VITE_WHATSAPP_PHONE`.

## 🚀 Deployment

### Opción 1: Vercel (Cliente) + Railway (Servidor)

**Cliente en Vercel:**
```bash
cd client
vercel --prod
```

**Servidor en Railway:**
- Conectar repositorio
- Configurar variables de entorno
- Railway detectará automáticamente el `package.json`

### Opción 2: Render (Full-stack)

**Cliente:**
- Static Site
- Build command: `cd client && npm install && npm run build`
- Publish directory: `client/dist`

**Servidor:**
- Web Service
- Build command: `cd server && npm install && npm run build`
- Start command: `cd server && npm start`

### Opción 3: VPS/Servidor Propio

```bash
# Instalar PM2 para gestión de procesos
npm install -g pm2

# Build de ambos proyectos
cd client && npm run build
cd ../server && npm run build

# Servir cliente con servidor web (nginx/Apache)
# Ejecutar servidor con PM2
cd server
pm2 start dist/index.js --name web-alahas-api
pm2 save
pm2 startup
```

## 🐛 Troubleshooting

### El formulario de contacto no envía emails

1. Verifica que `SMTP_USER` y `SMTP_PASS` sean correctos
2. Para Gmail, asegúrate de usar una "contraseña de aplicación"
3. Revisa que `SMTP_PORT` sea 587 (TLS) o 465 (SSL)
4. Comprueba los logs del servidor para errores específicos

### Las imágenes no cargan

1. Verifica que las rutas en `products.ts` sean correctas
2. Si usan rutas absolutas (`/images/...`), deben estar en `client/public/`
3. Si usan rutas relativas, deben estar en `client/src/assets/`

### Error de CORS en producción

Actualiza `server/src/index.ts`:

```typescript
app.use(cors({
  origin: ["https://tu-dominio-frontend.com"]
}))
```

### Vite proxy no funciona

Asegúrate de que:
1. El servidor esté corriendo en puerto 3000
2. `vite.config.ts` tenga configurado el proxy correcto
3. Ambos servidores estén ejecutándose simultáneamente

## 📈 Roadmap

- [ ] **v2.0**: Panel administrativo completo
  - [ ] Autenticación de administradores (JWT)
  - [ ] CRUD de productos con upload de imágenes
  - [ ] Gestión de categorías y etiquetas
  - [ ] Dashboard con métricas básicas
- [ ] **v2.1**: Base de datos
  - [ ] Migrar productos a PostgreSQL/MongoDB
  - [ ] Persistir consultas del formulario
  - [ ] Sistema de caché para mejor performance
- [ ] **v2.2**: Features avanzadas
  - [ ] Carrito de compras
  - [ ] Wishlist / Favoritos
  - [ ] Comparador de productos
  - [ ] Newsletter con Mailchimp/SendGrid
- [ ] **v2.3**: Optimizaciones
  - [ ] CDN para imágenes
  - [ ] Lazy loading mejorado
  - [ ] PWA (Progressive Web App)
  - [ ] Tests unitarios y E2E

## 📄 Licencia

Este proyecto es privado y propietario.

## 👤 Autor

**Diego Nancay**
- GitHub: [@athenasaint01](https://github.com/athenasaint01)

