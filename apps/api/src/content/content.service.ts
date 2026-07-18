import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ContentItem, ContentStatus, ContentType, Prisma, User } from '@prisma/client';
import { hasBlockerFailures, RheumaCondition, runComplianceChecks } from '@medgram/shared-types';
import { runGenerationPipeline } from '@medgram/content-pipeline';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';

const RECHECKABLE_STATUSES: ContentStatus[] = ['draft', 'needs_changes', 'pending_approval'];

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Paso 5: genera copy con el pipeline IA (con reintentos ante violaciones blocker),
   * crea el borrador y corre el chequeo automático (que lo promueve a pending_approval
   * si pasa el gate, o lo deja en draft para revisión manual si no).
   */
  async generateAndQueue(topic: string, type: ContentType, createdBy?: string, condition?: RheumaCondition) {
    const result = await runGenerationPipeline(topic, type, {
      log: (m) => this.logger.log(m),
      condition,
    });

    const item = await this.create({
      topic,
      type,
      generatedCopy: result.fullCopy,
      createdBy: createdBy ?? 'system:pipeline',
    });

    const check = await this.runComplianceCheck(item.id);

    return {
      item: await this.findOne(item.id),
      pipeline: {
        attempts: result.attempts,
        source: result.source,
        passedGate: check.passesGate,
        status: check.status,
      },
    };
  }

  /**
   * Regenera el copy de un ítem en needs_changes usando el comentario del doctor como
   * feedback inicial, reemplaza el copy y re-corre el chequeo (que lo vuelve a promover
   * a pending_approval si pasa el gate).
   */
  async regenerate(id: string, actor?: string) {
    const item = await this.findOne(id);
    if (item.status !== 'needs_changes') {
      throw new ConflictException(
        `Solo se puede regenerar contenido en needs_changes (estado actual: ${item.status})`,
      );
    }

    const result = await runGenerationPipeline(item.topic, item.type, {
      initialFeedback: item.doctorComments ?? undefined,
      log: (m) => this.logger.log(m),
    });

    await this.prisma.contentItem.update({
      where: { id },
      data: { generatedCopy: result.fullCopy },
    });
    // Deja rastro de quién regeneró (misma etapa needs_changes; la promoción la loguea el chequeo).
    await this.prisma.contentStatusLog.create({
      data: {
        contentItemId: id,
        fromStatus: 'needs_changes',
        toStatus: 'needs_changes',
        actor: actor ?? 'system:pipeline',
        reason: 'Regenerado con feedback del doctor',
      },
    });

    const check = await this.runComplianceCheck(id);

    return {
      item: await this.findOne(id),
      pipeline: {
        attempts: result.attempts,
        source: result.source,
        passedGate: check.passesGate,
        status: check.status,
      },
    };
  }

  async create(dto: CreateContentDto) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.contentItem.create({
        data: { type: dto.type, topic: dto.topic, generatedCopy: dto.generatedCopy },
      });
      await tx.contentStatusLog.create({
        data: {
          contentItemId: created.id,
          fromStatus: null,
          toStatus: 'draft',
          actor: dto.createdBy ?? 'system:api',
          reason: 'Borrador creado',
        },
      });
      return created;
    });
  }

  findAll(status?: ContentStatus) {
    return this.prisma.contentItem.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  findPendingApproval() {
    return this.prisma.contentItem.findMany({
      where: { status: 'pending_approval' },
      include: { complianceChecks: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.contentItem.findUnique({
      where: { id },
      include: {
        complianceChecks: true,
        statusLog: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!item) throw new NotFoundException(`Contenido ${id} no existe`);
    return item;
  }

  /**
   * Corre el validador de @medgram/shared-types y persiste los resultados.
   * Sin blockers -> pending_approval (+ notificación al doctor).
   * Con blockers estando en pending_approval -> se demota a draft (el gate no deja pasar).
   */
  async runComplianceCheck(id: string) {
    const item = await this.findOne(id);
    if (!item.generatedCopy) {
      throw new BadRequestException('El contenido no tiene copy para validar');
    }
    if (!RECHECKABLE_STATUSES.includes(item.status)) {
      throw new ConflictException(`No se puede validar contenido en estado ${item.status}`);
    }

    const results = runComplianceChecks(item.generatedCopy);
    const failed = results.filter((r) => !r.passed);
    const passesGate = !hasBlockerFailures(results);

    const promoted = passesGate && item.status !== 'pending_approval';
    const demoted = !passesGate && item.status === 'pending_approval';

    await this.prisma.$transaction(async (tx) => {
      await tx.complianceCheck.deleteMany({ where: { contentItemId: id } });
      await tx.complianceCheck.createMany({
        data: results.map((r) => ({
          contentItemId: id,
          rule: r.rule,
          severity: r.severity,
          passed: r.passed,
          detail: r.detail,
        })),
      });
      await tx.contentItem.update({
        where: { id },
        data: { complianceFlags: failed.map((f) => f.rule) },
      });
      if (promoted) {
        await this.logTransition(tx, item, 'pending_approval', 'system:compliance', null,
          `Chequeo automático aprobado (${failed.length} advertencias)`);
      } else if (demoted) {
        await this.logTransition(tx, item, 'draft', 'system:compliance', null,
          'Re-chequeo detectó violaciones blocker; vuelve a borrador');
      }
    });

    if (promoted) {
      await this.notifications.notifyDoctorPendingApproval(item);
    }

    return {
      contentItemId: id,
      passesGate,
      status: promoted ? 'pending_approval' : demoted ? 'draft' : item.status,
      results,
    };
  }

  async approve(id: string, reviewerEmail: string, comment?: string) {
    const item = await this.requirePending(id);
    const reviewer = await this.requireDoctor(reviewerEmail);
    await this.prisma.$transaction((tx) =>
      this.logTransition(tx, item, 'approved', reviewer.email, reviewer.id, comment ?? 'Aprobado', {
        approvedById: reviewer.id,
        approvedAt: new Date(),
        doctorComments: comment ?? null,
      }),
    );
    return this.findOne(id);
  }

  async reject(id: string, reviewerEmail: string, reason: string) {
    const item = await this.requirePending(id);
    const reviewer = await this.requireDoctor(reviewerEmail);
    await this.prisma.$transaction((tx) =>
      this.logTransition(tx, item, 'rejected', reviewer.email, reviewer.id, reason, {
        doctorComments: reason,
      }),
    );
    return this.findOne(id);
  }

  async requestChanges(id: string, reviewerEmail: string, comment: string) {
    const item = await this.requirePending(id);
    const reviewer = await this.requireDoctor(reviewerEmail);
    await this.prisma.$transaction((tx) =>
      this.logTransition(tx, item, 'needs_changes', reviewer.email, reviewer.id, comment, {
        doctorComments: comment,
      }),
    );
    return this.findOne(id);
  }

  // ---- Fase 2: publicación (estados scheduled -> published) ----

  /** approved -> scheduled. Registra scheduledFor y audita. */
  async markScheduled(id: string, scheduledFor: Date, actor: string) {
    const item = await this.findOne(id);
    if (item.status !== 'approved') {
      throw new ConflictException(
        `Solo se puede programar contenido aprobado (estado actual: ${item.status})`,
      );
    }
    await this.prisma.$transaction((tx) =>
      this.logTransition(
        tx,
        item,
        'scheduled',
        actor,
        null,
        `Programado para ${scheduledFor.toISOString()}`,
        { scheduledFor },
      ),
    );
    return this.findOne(id);
  }

  /** scheduled -> published. Lo llama el worker tras publicar (o simular). */
  async markPublished(id: string, igMediaId: string) {
    const item = await this.findOne(id);
    if (item.status !== 'scheduled') {
      throw new ConflictException(
        `Solo se puede publicar contenido programado (estado actual: ${item.status})`,
      );
    }
    await this.prisma.$transaction((tx) =>
      this.logTransition(
        tx,
        item,
        'published',
        'system:publisher',
        null,
        `Publicado (ig_media_id=${igMediaId})`,
        { publishedAt: new Date(), igMediaId },
      ),
    );
    return this.findOne(id);
  }

  /** Sets generated media (images/videos) on a content item without changing its status. */
  async setMedia(id: string, media: Array<{ url: string; source: string; prompt: string }>) {
    await this.prisma.contentItem.update({
      where: { id },
      data: { generatedMedia: media },
    });
  }

  /** Deja rastro de un fallo de publicación sin cambiar el estado (la cola reintenta). */
  async markPublishFailed(id: string, reason: string) {
    const item = await this.findOne(id);
    await this.prisma.contentStatusLog.create({
      data: {
        contentItemId: id,
        fromStatus: item.status,
        toStatus: item.status,
        actor: 'system:publisher',
        reason: `Fallo de publicación: ${reason}`,
      },
    });
  }

  /** Todo cambio de estado pasa por acá: update + registro de auditoría en la misma transacción. */
  private async logTransition(
    tx: Prisma.TransactionClient,
    item: ContentItem,
    toStatus: ContentStatus,
    actor: string,
    changedById: string | null,
    reason: string,
    extraData: Prisma.ContentItemUncheckedUpdateInput = {},
  ) {
    await tx.contentItem.update({
      where: { id: item.id },
      data: { status: toStatus, ...extraData },
    });
    await tx.contentStatusLog.create({
      data: {
        contentItemId: item.id,
        fromStatus: item.status,
        toStatus,
        actor,
        changedById,
        reason,
      },
    });
  }

  private async requirePending(id: string) {
    const item = await this.findOne(id);
    if (item.status !== 'pending_approval') {
      throw new ConflictException(
        `Solo se puede revisar contenido en pending_approval (estado actual: ${item.status})`,
      );
    }
    return item;
  }

  private async requireDoctor(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new ForbiddenException(`Usuario ${email} no existe`);
    if (user.role !== 'doctor_approver') {
      throw new ForbiddenException('Solo un doctor_approver puede revisar contenido');
    }
    return user;
  }
}
