import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import contactRouter from "./routes/contact";
import productsRouter from "./routes/products";
import authRouter from "./routes/auth";
import categoriesRouter from "./routes/categories";
import materialsRouter from "./routes/materials";
import tagsRouter from "./routes/tags";
import adminProductsRouter from "./routes/admin/products";
import adminCategoriesRouter from "./routes/admin/categories";
import adminMaterialsRouter from "./routes/admin/materials";
import adminTagsRouter from "./routes/admin/tags";
import adminCollectionsRouter from "./routes/admin/collections";
import collectionsRouter from "./routes/collections";
import fixAdminRouter from "./routes/fix-admin";
import { verifyTransporter } from "./email";
import { testConnection } from "./config/database";

const app = express();

// Seguridad y parsers
app.use(helmet());
app.use(express.json({ limit: '50mb' })); // Aumentar límite para imágenes base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS (si NO usas proxy de Vite)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177"], // añade tu dominio en prod
  })
);

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes - Públicas
app.use("/api/contact", contactRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/materials", materialsRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/collections", collectionsRouter);

// TEMPORAL: Fix admin password (DELETE AFTER USE)
app.use("/api/dev", fixAdminRouter);

// API Routes - Admin (protegidas con JWT)
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/categories", adminCategoriesRouter);
app.use("/api/admin/materials", adminMaterialsRouter);
app.use("/api/admin/tags", adminTagsRouter);
app.use("/api/admin/collections", adminCollectionsRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API funcionando correctamente" });
});

const port = Number(process.env.PORT || 3000);

// Iniciar servidor
const startServer = async () => {
  try {
    // Verificar conexión a PostgreSQL
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ No se pudo conectar a PostgreSQL. Verifica la configuración en .env');
      process.exit(1);
    }

    // Verificar configuración de email
    verifyTransporter();

    // Iniciar servidor
    app.listen(port, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Servidor API iniciado en http://localhost:${port}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📍 Endpoints públicos:');
      console.log(`   GET  http://localhost:${port}/api/health`);
      console.log(`   POST http://localhost:${port}/api/contact`);
      console.log(`   GET  http://localhost:${port}/api/products`);
      console.log(`   GET  http://localhost:${port}/api/categories`);
      console.log(`   GET  http://localhost:${port}/api/materials`);
      console.log(`   GET  http://localhost:${port}/api/tags`);
      console.log(`   GET  http://localhost:${port}/api/collections`);
      console.log(`   POST http://localhost:${port}/api/auth/login`);
      console.log(`   POST http://localhost:${port}/api/auth/register`);
      console.log('');
      console.log('🔒 Endpoints admin (requieren JWT):');
      console.log(`   POST/PUT/DELETE http://localhost:${port}/api/admin/products`);
      console.log(`   POST/PUT/DELETE http://localhost:${port}/api/admin/categories`);
      console.log(`   POST/PUT/DELETE http://localhost:${port}/api/admin/materials`);
      console.log(`   POST/PUT/DELETE http://localhost:${port}/api/admin/tags`);
      console.log(`   POST/PUT/DELETE http://localhost:${port}/api/admin/collections`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
