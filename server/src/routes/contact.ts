import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { transporter } from "../email";

const router = Router();

// Rate limit básico: 5 envíos por IP cada 10 minutos
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(limiter);

// Esquema de validación
const ContactSchema = z.object({
  nombre: z.string().min(2).max(80),
  email: z.string().email(),
  telefono: z.string().min(5).max(30),
  fecha: z.string().optional().nullable(),
  origen: z.string().optional().nullable(),
  mensaje: z.string().max(1000).optional().nullable(),
});

router.post("/", async (req, res) => {
  const parse = ContactSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ ok: false, errors: parse.error.flatten() });
  }
  const data = parse.data;

  const subject = "Nueva solicitud de visita - Sitio";
  const html = `
    <h2>Nueva solicitud de visita</h2>
    <p><b>Nombre:</b> ${data.nombre}</p>
    <p><b>Email:</b> ${data.email}</p>
    <p><b>Teléfono:</b> ${data.telefono}</p>
    ${data.fecha ? `<p><b>Fecha preferida:</b> ${data.fecha}</p>` : ""}
    ${data.origen ? `<p><b>¿Cómo nos conoció?:</b> ${data.origen}</p>` : ""}
    ${data.mensaje ? `<p><b>Mensaje:</b><br>${escapeHtml(data.mensaje)}</p>` : ""}
    <hr>
    <small>Enviado desde el formulario web.</small>
  `;
  const text = [
    `Nueva solicitud de visita`,
    `Nombre: ${data.nombre}`,
    `Email: ${data.email}`,
    `Teléfono: ${data.telefono}`,
    data.fecha ? `Fecha preferida: ${data.fecha}` : "",
    data.origen ? `Origen: ${data.origen}` : "",
    data.mensaje ? `Mensaje: ${data.mensaje}` : "",
  ].filter(Boolean).join("\n");

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_TO,
      subject,
      text,
      html,
      replyTo: data.email, // útil para responder directo al prospecto
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error enviando email:", err);
    return res.status(500).json({ ok: false, message: "No se pudo enviar el correo." });
  }
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default router;
