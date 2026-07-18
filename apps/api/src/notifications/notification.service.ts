import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter | null = null;

  /** Crea el transporter una sola vez si hay SMTP configurado; null si no. */
  private getTransporter(): nodemailer.Transporter | null {
    if (!process.env.SMTP_HOST) return null;
    if (!this.transporter) {
      const port = Number(process.env.SMTP_PORT ?? 587);
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }
    return this.transporter;
  }

  /**
   * Notifica al doctor que hay contenido pendiente. Con SMTP configurado envía un email
   * con enlace directo al detalle; sin SMTP registra la notificación en el log (Fase 1).
   * Un fallo de envío se loguea pero NO rompe el flujo: el contenido ya está en la cola.
   */
  async notifyDoctorPendingApproval(item: { id: string; topic: string }) {
    const to = process.env.NOTIFY_DOCTOR_EMAIL || 'doctor@medgram.local';
    const dashboardUrl = process.env.DASHBOARD_URL ?? 'http://localhost:3000';
    const link = `${dashboardUrl}/content/${item.id}`;

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.log(
        `[notificación simulada] Para ${to}: contenido "${item.topic}" (${item.id}) pendiente de aprobación — ${link}`,
      );
      return;
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'medgram <no-reply@medgram.local>',
        to,
        subject: `Contenido pendiente de aprobación: ${item.topic}`,
        text:
          `Hay contenido esperando tu revisión.\n\n` +
          `Tema: ${item.topic}\n` +
          `Revisar y aprobar: ${link}\n\n` +
          `Este es un mensaje automático; no respondas a este correo.`,
        html:
          `<p>Hay contenido esperando tu revisión.</p>` +
          `<p><strong>Tema:</strong> ${item.topic}</p>` +
          `<p><a href="${link}">Revisar y aprobar</a></p>` +
          `<p style="color:#888;font-size:12px">Mensaje automático; no respondas a este correo.</p>`,
      });
      this.logger.log(`Notificación enviada a ${to} por "${item.topic}" (${item.id})`);
    } catch (e) {
      this.logger.error(
        `No se pudo enviar email a ${to}: ${(e as Error).message}. El contenido igual quedó en la cola.`,
      );
    }
  }
}
