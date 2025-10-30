import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import contactRouter from "./routes/contact";
import { verifyTransporter } from "./email";

const app = express();

// Seguridad y parsers
app.use(helmet());
app.use(express.json());

// CORS (si NO usas proxy de Vite)
app.use(
  cors({
    origin: ["http://localhost:5173"], // añade tu dominio en prod
  })
);

// API
app.use("/api/contact", contactRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`🚀 API escuchando en http://localhost:${port}`);
  verifyTransporter();
});
