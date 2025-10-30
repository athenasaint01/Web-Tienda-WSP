import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465, // 465 = SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function verifyTransporter() {
  try {
    await transporter.verify();
    console.log("✅ SMTP listo para enviar");
  } catch (err) {
    console.error("❌ Error verificando SMTP:", err);
  }
}
