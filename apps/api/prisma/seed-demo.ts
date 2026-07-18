// Seed de DEMO: puebla contenido en todos los estados para mostrar el panel y el calendario.
// OJO: borra el contenido existente (no los usuarios) antes de sembrar. Idempotente por reset.
//   Ejecutar desde apps/api:  npm run db:seed:demo
import { ContentStatus, ContentType, PrismaClient } from '@prisma/client';
import { runComplianceChecks } from '@medgram/shared-types';

try {
  // Carga apps/api/.env (DATABASE_URL) si no viene ya del entorno.
  process.loadEnvFile('.env');
} catch {
  // .env no encontrado: se asume DATABASE_URL en el entorno.
}

const prisma = new PrismaClient();

const DOCTOR = 'doctor@medgram.local';
const AGENCY = 'admin@medgram.local';
const DISCLAIMER = 'Este contenido es informativo y no reemplaza una consulta médica.';

function copy(body: string, tags: string[]): string {
  return `${body} ${DISCLAIMER} Agenda tu control con un profesional.\n\n${tags.map((t) => `#${t}`).join(' ')}`;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 30, 0, 0);
  return d;
}

interface DemoSpec {
  topic: string;
  type: ContentType;
  copy: string;
  state: ContentStatus;
  scheduledFor?: Date;
  publishedAt?: Date;
  comment?: string;
}

const DEMO: DemoSpec[] = [
  // --- Publicados (pasado) → chips verdes en el calendario ---
  {
    topic: 'Beneficios del control médico preventivo anual',
    type: 'post',
    state: 'published',
    publishedAt: daysFromNow(-11),
    copy: copy(
      'Un control médico anual ayuda a detectar a tiempo condiciones frecuentes. Según el MINSAL, los chequeos periódicos son parte del cuidado de la salud.',
      ['SaludPreventiva', 'ControlMedico', 'Bienestar'],
    ),
  },
  {
    topic: 'Higiene del sueño: hábitos para dormir mejor',
    type: 'carousel',
    state: 'published',
    publishedAt: daysFromNow(-6),
    copy: copy(
      'Mantener horarios regulares y reducir pantallas antes de dormir favorece el descanso. La OMS destaca el sueño como pilar de la salud.',
      ['HigieneDelSueno', 'Descanso', 'SaludGeneral'],
    ),
  },
  {
    topic: 'Vacunación de invierno: información general',
    type: 'post',
    state: 'published',
    publishedAt: daysFromNow(-2),
    copy: copy(
      'La vacunación estacional es una medida de prevención recomendada por la autoridad sanitaria. Infórmate en fuentes oficiales sobre los grupos priorizados.',
      ['Vacunacion', 'Invierno', 'Prevencion'],
    ),
  },
  // --- Programados (futuro) → chips celestes en el calendario ---
  {
    topic: 'Alimentación balanceada en la tercera edad',
    type: 'carousel',
    state: 'scheduled',
    scheduledFor: daysFromNow(2),
    copy: copy(
      'Una dieta variada y suficiente hidratación apoyan el bienestar en adultos mayores. Consulta a un profesional para una pauta personalizada.',
      ['AdultoMayor', 'Nutricion', 'Bienestar'],
    ),
  },
  {
    topic: 'Cómo prevenir el resfrío común',
    type: 'reel',
    state: 'scheduled',
    scheduledFor: daysFromNow(5),
    copy: copy(
      'El lavado frecuente de manos y la ventilación reducen la transmisión de virus respiratorios. La OMS recomienda estas medidas cotidianas.',
      ['Prevencion', 'Resfrio', 'SaludGeneral'],
    ),
  },
  {
    topic: 'Salud cardiovascular: mitos frecuentes',
    type: 'post',
    state: 'scheduled',
    scheduledFor: daysFromNow(12),
    copy: copy(
      'La actividad física regular y una alimentación equilibrada apoyan la salud del corazón. Los controles periódicos ayudan a su seguimiento.',
      ['SaludCardiovascular', 'Corazon', 'MedicinaPreventiva'],
    ),
  },
  // --- Aprobado (sin fecha aún) ---
  {
    topic: 'Importancia de la hidratación diaria',
    type: 'post',
    state: 'approved',
    copy: copy(
      'Tomar agua a lo largo del día apoya funciones básicas del organismo. Las necesidades varían según cada persona y su actividad.',
      ['Hidratacion', 'Bienestar', 'SaludGeneral'],
    ),
  },
  // --- Pendiente de aprobación ---
  {
    topic: 'Manejo del estrés en el día a día',
    type: 'carousel',
    state: 'pending_approval',
    copy: copy(
      'Pausas activas, sueño suficiente y apoyo social ayudan a sobrellevar el estrés cotidiano. Si te afecta de forma persistente, busca orientación profesional.',
      ['Estres', 'SaludMental', 'Autocuidado'],
    ),
  },
  // --- Cambios solicitados ---
  {
    topic: 'Cuidado de la piel en invierno',
    type: 'reel',
    state: 'needs_changes',
    comment: 'Suaviza el llamado a la acción y agrega una fuente citable sobre hidratación de la piel.',
    copy: copy(
      'El frío y la calefacción pueden resecar la piel; la hidratación y la protección solar siguen siendo importantes en invierno.',
      ['CuidadoDeLaPiel', 'Invierno', 'Dermatologia'],
    ),
  },
  // --- Rechazado ---
  {
    topic: 'Ejercicio físico y salud mental',
    type: 'post',
    state: 'rejected',
    comment: 'El enfoque no representa el tono de la consulta; prefiero reformularlo más adelante.',
    copy: copy(
      'La actividad física regular se asocia a beneficios para el ánimo y el bienestar general, según la evidencia disponible.',
      ['Ejercicio', 'SaludMental', 'Bienestar'],
    ),
  },
  // --- Borrador ---
  {
    topic: 'Chequeos recomendados según la edad',
    type: 'carousel',
    state: 'draft',
    copy: copy(
      'Las recomendaciones de controles preventivos varían según la etapa de la vida. Un profesional puede orientarte sobre los adecuados para ti.',
      ['ControlPreventivo', 'SaludPorEdad', 'MedicinaPreventiva'],
    ),
  },
];

async function createDemo(doctorId: string, spec: DemoSpec, index: number) {
  const results = runComplianceChecks(spec.copy);
  const failed = results.filter((r) => !r.passed);

  const data: Parameters<typeof prisma.contentItem.create>[0]['data'] = {
    type: spec.type,
    topic: spec.topic,
    status: spec.state,
    generatedCopy: spec.copy,
    complianceFlags: failed.map((f) => f.rule),
  };

  const log: { fromStatus: ContentStatus | null; toStatus: ContentStatus; actor: string; reason: string }[] = [
    { fromStatus: null, toStatus: 'draft', actor: AGENCY, reason: 'Borrador creado' },
  ];

  if (spec.state !== 'draft') {
    log.push({
      fromStatus: 'draft',
      toStatus: 'pending_approval',
      actor: 'system:compliance',
      reason: 'Chequeo automático aprobado',
    });
  }
  if (spec.state === 'needs_changes') {
    data.doctorComments = spec.comment;
    log.push({ fromStatus: 'pending_approval', toStatus: 'needs_changes', actor: DOCTOR, reason: spec.comment ?? 'Cambios' });
  }
  if (spec.state === 'rejected') {
    data.doctorComments = spec.comment;
    log.push({ fromStatus: 'pending_approval', toStatus: 'rejected', actor: DOCTOR, reason: spec.comment ?? 'Rechazado' });
  }
  if (spec.state === 'approved' || spec.state === 'scheduled' || spec.state === 'published') {
    data.approvedById = doctorId;
    data.approvedAt = spec.publishedAt ?? spec.scheduledFor ?? new Date();
    log.push({ fromStatus: 'pending_approval', toStatus: 'approved', actor: DOCTOR, reason: 'Aprobado' });
  }
  if (spec.state === 'scheduled' || spec.state === 'published') {
    data.scheduledFor = spec.scheduledFor ?? spec.publishedAt;
    log.push({
      fromStatus: 'approved',
      toStatus: 'scheduled',
      actor: AGENCY,
      reason: `Programado para ${(spec.scheduledFor ?? spec.publishedAt)?.toISOString()}`,
    });
  }
  if (spec.state === 'published') {
    data.publishedAt = spec.publishedAt;
    data.igMediaId = `stub_demo_${1000 + index}`;
    log.push({
      fromStatus: 'scheduled',
      toStatus: 'published',
      actor: 'system:publisher',
      reason: `Publicado (ig_media_id=stub_demo_${1000 + index})`,
    });
  }

  const item = await prisma.contentItem.create({ data });
  await prisma.complianceCheck.createMany({
    data: results.map((r) => ({
      contentItemId: item.id,
      rule: r.rule,
      severity: r.severity,
      passed: r.passed,
      detail: r.detail,
    })),
  });
  for (const entry of log) {
    await prisma.contentStatusLog.create({ data: { contentItemId: item.id, ...entry } });
  }
  return item;
}

async function main() {
  // Usuarios (idempotente).
  const doctor = await prisma.user.upsert({
    where: { email: DOCTOR },
    update: {},
    create: { email: DOCTOR, name: 'Dr. Aprobador', role: 'doctor_approver' },
  });
  await prisma.user.upsert({
    where: { email: AGENCY },
    update: {},
    create: { email: AGENCY, name: 'Agencia Admin', role: 'agency_admin' },
  });

  // Reset de contenido (status_log tiene onDelete: Restrict → borrar en orden).
  await prisma.contentStatusLog.deleteMany();
  await prisma.complianceCheck.deleteMany();
  const removed = await prisma.contentItem.deleteMany();
  console.log(`Reset: ${removed.count} contenido(s) previo(s) eliminado(s).`);

  let i = 0;
  for (const spec of DEMO) {
    await createDemo(doctor.id, spec, i++);
  }

  const counts = await prisma.contentItem.groupBy({ by: ['status'], _count: true });
  console.log('Demo sembrada:');
  for (const c of counts) console.log(`  ${c.status}: ${c._count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
