import { Injectable, Logger } from '@nestjs/common';

export const INSTAGRAM_PUBLISHER = Symbol('INSTAGRAM_PUBLISHER');

export interface PublishInput {
  id: string;
  type: string;
  copy: string;
  mediaUrls?: string[];
}

export interface PublishResult {
  igMediaId: string;
}

export interface InstagramPublisher {
  publish(input: PublishInput): Promise<PublishResult>;
}

/**
 * Fase 2 — publicador SIMULADO. No llama a Meta; devuelve un ig_media_id ficticio.
 *
 * Cuando la app pase Meta App Review, esta clase se reemplaza por una que implemente
 * el flujo real de la Instagram Content Publishing API (sin cambiar nada más del sistema):
 *
 *   1) POST /{ig-user-id}/media
 *        - post/carrusel: image_url(s) + caption
 *        - reel:          media_type=REELS, video_url (9:16, 5-90s, H.264/HEVC)
 *      -> devuelve un creation_id (container)
 *   2) GET /{ig-container-id}?fields=status_code   (poll hasta status_code=FINISHED)
 *   3) POST /{ig-user-id}/media_publish  con creation_id
 *      -> devuelve el id real del media publicado
 *
 * Requisitos reales (fuera de nuestro control de tiempos):
 *   - Cuenta de Instagram Business vinculada a una Página de Facebook.
 *   - App con permisos `instagram_business_basic` + `instagram_business_content_publish`
 *     aprobados por Meta App Review (~2-4 semanas).
 *   - Media accesible por URL pública (S3/R2) antes de publicar.
 *   - Cola con margen para los rate limits basados en "Business Use Case".
 */
@Injectable()
export class StubInstagramPublisher implements InstagramPublisher {
  private readonly logger = new Logger(StubInstagramPublisher.name);

  async publish(input: PublishInput): Promise<PublishResult> {
    this.logger.log(`[stub-publisher] simulando publicación de ${input.id} (${input.type})`);
    // Simula la creación del container + procesamiento antes del media_publish.
    await new Promise((resolve) => setTimeout(resolve, 300));
    const igMediaId = `stub_${input.id.slice(0, 8)}_${Date.now()}`;
    this.logger.log(`[stub-publisher] publicado (simulado) con ig_media_id=${igMediaId}`);
    return { igMediaId };
  }
}
