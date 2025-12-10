# 🚀 Backend API - Web Alahas

API REST construida con Express + TypeScript + PostgreSQL para el e-commerce de joyería.

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 12+ con la base de datos `bd_sh0p4l4h45` configurada
- npm o yarn

## ⚙️ Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

El archivo `.env` ya está configurado con:

```env
# Servidor
PORT=3000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bd_sh0p4l4h45
DB_USER=postgres
DB_PASSWORD=123456

# JWT
JWT_SECRET=alahas-jwt-secret-2025-cambiar-en-produccion
JWT_EXPIRES_IN=7d

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=diegonancay1@gmail.com
SMTP_PASS=mpop zwkg znic tkyv
MAIL_FROM="Web Alahas <diegonancay1@gmail.com>"
MAIL_TO=diegonancay1@gmail.com
```

⚠️ **IMPORTANTE**: Cambiar `JWT_SECRET` en producción.

### 3. Crear base de datos

Asegúrate de haber ejecutado los scripts SQL en pgAdmin 4:

```sql
-- 1. Ejecutar database/schema.sql
-- 2. Ejecutar database/seed.sql
```

Ver instrucciones completas en `database/README.md`

## 🏃 Ejecución

### Modo desarrollo (con hot-reload)

```bash
npm run dev
```

### Modo producción

```bash
npm run build
npm start
```

## 📡 Endpoints de la API

### Health Check

```http
GET /api/health
```

Respuesta:
```json
{
  "ok": true,
  "message": "API funcionando correctamente"
}
```

---

### 🔐 Autenticación

#### Registrar usuario admin

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@alahas.com",
  "password": "admin123",
  "full_name": "Administrador",
  "role": "admin"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@alahas.com",
  "password": "admin123"
}
```

Respuesta:
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "email": "admin@alahas.com",
    "full_name": "Administrador",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Obtener usuario actual

```http
GET /api/auth/me
Authorization: Bearer {token}
```

#### Cambiar contraseña

```http
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "oldPassword": "admin123",
  "newPassword": "nueva-contraseña-segura"
}
```

---

### 💍 Productos

#### Listar todos los productos (con filtros)

```http
GET /api/products
GET /api/products?categoria=collares
GET /api/products?material=acero&tag=minimal
GET /api/products?q=aurora
GET /api/products?featured=true
GET /api/products?sort=nombre-asc
GET /api/products?page=1&limit=10
```

**Parámetros de query:**
- `categoria`: string | string[] - Filtrar por categoría (slug)
- `material`: string | string[] - Filtrar por material (slug)
- `tag`: string | string[] - Filtrar por tag (slug)
- `q`: string - Búsqueda por nombre o descripción
- `featured`: boolean - Solo productos destacados
- `sort`: 'relevancia' | 'nombre-asc' | 'nombre-desc' | 'recent'
- `page`: number - Página actual (default: 1)
- `limit`: number - Productos por página (default: 50)

Respuesta:
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "slug": "collar-aurora",
      "name": "Collar Aurora",
      "category": "Collares",
      "category_slug": "collares",
      "description": "Collar tipo media luna...",
      "featured": true,
      "image_url": "/assets/collar.png",
      "materials": ["Acero", "Baño De Oro"],
      "tags": ["Minimal", "Diario"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 6,
    "totalPages": 1
  }
}
```

#### Obtener producto por slug

```http
GET /api/products/:slug
GET /api/products/collar-aurora
```

Respuesta:
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "slug": "collar-aurora",
    "name": "Collar Aurora",
    "description": "Collar tipo media luna...",
    "featured": true,
    "wa_template": "Hola, me interesa el Collar Aurora...",
    "category": {
      "id": 1,
      "name": "Collares",
      "slug": "collares"
    },
    "images": [
      {
        "id": 1,
        "image_url": "/assets/collar.png",
        "is_primary": true,
        "display_order": 1
      }
    ],
    "materials": [
      { "id": 1, "name": "Acero", "slug": "acero" },
      { "id": 2, "name": "Baño De Oro", "slug": "bano-de-oro" }
    ],
    "tags": [
      { "id": 1, "name": "Minimal", "slug": "minimal" },
      { "id": 2, "name": "Diario", "slug": "diario" }
    ]
  }
}
```

#### Crear producto (requiere autenticación admin)

```http
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "slug": "nuevo-collar",
  "name": "Collar Nuevo",
  "category_id": 1,
  "description": "Descripción del producto",
  "featured": false,
  "wa_template": "Hola, me interesa el Collar Nuevo",
  "images": [
    {
      "url": "/assets/nuevo-collar.png",
      "is_primary": true,
      "alt_text": "Collar nuevo vista principal"
    }
  ],
  "material_ids": [1, 2],
  "tag_ids": [1, 3]
}
```

#### Actualizar producto (requiere autenticación admin)

```http
PUT /api/products/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Collar Aurora Actualizado",
  "description": "Nueva descripción",
  "featured": true,
  "is_active": true
}
```

#### Eliminar producto (requiere autenticación admin)

```http
DELETE /api/products/:id
Authorization: Bearer {token}
```

Nota: Esto es un "soft delete", el producto se marca como `is_active = false`.

---

### 📧 Contacto

#### Enviar mensaje de contacto

```http
POST /api/contact
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "987654321",
  "mensaje": "Hola, me interesa conocer más sobre sus productos",
  "fecha": "2025-12-15",
  "origen": "Website"
}
```

**Rate limit**: 5 requests por 10 minutos por IP.

## 🔒 Seguridad

### Autenticación

La API usa JWT (JSON Web Tokens) para autenticación. Para acceder a rutas protegidas:

1. Hacer login en `/api/auth/login`
2. Guardar el token recibido
3. Incluir el token en el header `Authorization: Bearer {token}` en cada request

### Rutas protegidas

- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)
- `GET /api/auth/me` - Perfil del usuario
- `POST /api/auth/change-password` - Cambiar contraseña

## 🗄️ Base de Datos

### Conexión

La conexión a PostgreSQL se configura en `src/config/database.ts` usando un pool de conexiones con las siguientes características:

- **Max connections**: 20
- **Idle timeout**: 30s
- **Connection timeout**: 2s

### Modelos principales

- `categories` - Categorías de productos
- `materials` - Materiales disponibles
- `tags` - Tags para clasificación
- `products` - Productos principales
- `product_images` - Imágenes de productos
- `product_materials` - Relación N:M productos-materiales
- `product_tags` - Relación N:M productos-tags
- `users` - Usuarios administradores

Ver esquema completo en `database/schema.sql`

## 📁 Estructura del Proyecto

```
server/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuración de PostgreSQL
│   ├── middleware/
│   │   └── auth.ts               # Middleware de autenticación
│   ├── routes/
│   │   ├── auth.ts               # Rutas de autenticación
│   │   ├── products.ts           # Rutas de productos
│   │   └── contact.ts            # Ruta de contacto
│   ├── services/
│   │   ├── authService.ts        # Lógica de autenticación
│   │   └── productService.ts     # Lógica de productos
│   ├── types/
│   │   └── models.ts             # Tipos TypeScript
│   ├── email.ts                  # Configuración de Nodemailer
│   └── index.ts                  # Punto de entrada
├── .env                          # Variables de entorno
├── .env.example                  # Ejemplo de variables
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testing

Para probar la API, puedes usar:

- **Thunder Client** (extensión VS Code)
- **Postman**
- **cURL**
- **HTTPie**

### Ejemplo con cURL:

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alahas.com","password":"admin123"}'

# Obtener productos
curl http://localhost:3000/api/products

# Obtener producto específico
curl http://localhost:3000/api/products/collar-aurora
```

## 🚨 Troubleshooting

### Error: "No se pudo conectar a PostgreSQL"

1. Verificar que PostgreSQL esté corriendo
2. Verificar credenciales en `.env`
3. Verificar que la base de datos `bd_sh0p4l4h45` exista
4. Verificar que se hayan ejecutado los scripts `schema.sql` y `seed.sql`

### Error: "Token inválido o expirado"

1. Verificar que el token esté en el formato `Bearer {token}`
2. Hacer login nuevamente para obtener un token nuevo
3. Verificar que `JWT_SECRET` en `.env` no haya cambiado

### Error: "Port already in use"

1. Cambiar el puerto en `.env`
2. O cerrar el proceso que está usando el puerto 3000:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID {PID} /F

# Linux/Mac
lsof -i :3000
kill -9 {PID}
```

## 📝 Notas de Desarrollo

### Agregar nuevas rutas

1. Crear archivo en `src/routes/`
2. Importar en `src/index.ts`
3. Montar ruta con `app.use('/api/ruta', rutaRouter)`

### Agregar middleware de autenticación

```typescript
import { authenticate, requireAdmin } from '../middleware/auth';

router.get('/protected', authenticate, (req, res) => {
  // req.user contiene el payload del JWT
  res.json({ user: req.user });
});

router.post('/admin-only', authenticate, requireAdmin, (req, res) => {
  // Solo usuarios con role 'admin'
});
```

## 🔄 Próximos Pasos

- [ ] Implementar rutas para categorías, materiales y tags
- [ ] Agregar upload de imágenes (multer + cloudinary)
- [ ] Implementar validación de schemas con Zod
- [ ] Agregar tests unitarios (Jest)
- [ ] Implementar rate limiting global
- [ ] Agregar logging (Winston o Pino)
- [ ] Deploy a producción (Railway, Render, Fly.io)

---

**Versión**: 1.0
**Mantenedor**: Web Alahas Development Team
