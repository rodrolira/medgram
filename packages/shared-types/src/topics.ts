import { ContentType } from './index';

export type RheumaCondition =
  | 'artritis_reumatoide'
  | 'lupus'
  | 'osteoartritis'
  | 'espondilitis'
  | 'bienestar';

export interface RheumatologyTopic {
  topic: string;
  condition: RheumaCondition;
  /** Preferred content type for this topic angle. */
  type: ContentType;
  /** 1-based publish slot index (1=9 AM, 2=1 PM, 3=4 PM, 4=7 PM, 5=10 AM next day). */
  slot: 1 | 2 | 3 | 4 | 5;
}

/**
 * Day-of-week to condition mapping (0=Sunday … 6=Saturday).
 * Saturday and Sunday default to bienestar (less clinical, higher engagement on weekends).
 */
export const DAY_CONDITION: Record<number, RheumaCondition> = {
  0: 'bienestar',          // Sunday
  1: 'artritis_reumatoide', // Monday
  2: 'lupus',              // Tuesday
  3: 'osteoartritis',      // Wednesday
  4: 'espondilitis',       // Thursday
  5: 'bienestar',          // Friday
  6: 'bienestar',          // Saturday
};

/**
 * 10 topic variants per condition — enough for 2 full weeks of daily rotation
 * before repeating. Picked by: (ISO week number % 2) * 5 + (slot - 1).
 * All topics are pre-validated to be medically accurate and safe for
 * rheumatology audiences (no diagnostic claims, educational framing).
 */
const TOPIC_POOL: Record<RheumaCondition, Array<[string, ContentType]>> = {
  artritis_reumatoide: [
    ['Artritis reumatoide: señales tempranas que merecen una evaluación médica', 'post'],
    ['¿Cómo se diagnostica la artritis reumatoide? Pasos y estudios habituales', 'carousel'],
    ['Tratamientos actuales para la artritis reumatoide: una mirada educativa', 'carousel'],
    ['Artritis reumatoide y actividad física: ejercicios recomendados por la ciencia', 'post'],
    ['Mitos y realidades de la artritis reumatoide', 'post'],
    ['Artritis reumatoide y alimentación antiinflamatoria: lo que dice la evidencia', 'carousel'],
    ['El papel del reumatólogo en el manejo de la artritis reumatoide', 'post'],
    ['Artritis reumatoide: diferencias con la artrosis que conviene conocer', 'carousel'],
    ['Fatiga en la artritis reumatoide: causas y estrategias de manejo', 'post'],
    ['Artritis reumatoide: seguimiento regular y control de la inflamación', 'post'],
  ],
  lupus: [
    ['Lupus eritematoso sistémico: síntomas frecuentes que orientan la consulta', 'post'],
    ['Cómo el lupus afecta distintos sistemas del organismo: guía educativa', 'carousel'],
    ['Manejo del estrés en lupus: técnicas respaldadas por especialistas', 'post'],
    ['Lupus y exposición solar: recomendaciones básicas de fotoprotección', 'carousel'],
    ['Calidad de vida con lupus: estrategias para el día a día', 'post'],
    ['Lupus y articulaciones: cuándo consultar a un reumatólogo', 'post'],
    ['Lupus y embarazo: la importancia del seguimiento médico especializado', 'carousel'],
    ['¿Qué es el síndrome antifosfolípido y su relación con el lupus?', 'post'],
    ['Lupus: el rol del laboratorio en el seguimiento de la enfermedad', 'carousel'],
    ['Lupus y actividad física: moverse con precaución y acompañamiento', 'post'],
  ],
  osteoartritis: [
    ['Osteoartritis: qué ocurre en las articulaciones y por qué aparece', 'carousel'],
    ['Prevención de la osteoartritis: hábitos que protegen las articulaciones', 'post'],
    ['Osteoartritis de rodilla: ejercicios suaves para mantener la movilidad', 'carousel'],
    ['Peso corporal y osteoartritis: evidencia sobre la relación entre ambos', 'post'],
    ['Osteoartritis de cadera: cuándo evaluar opciones con un especialista', 'post'],
    ['Osteoartritis en manos: síntomas y actividades adaptadas', 'carousel'],
    ['Calzado y osteoartritis: consideraciones para proteger rodillas y caderas', 'post'],
    ['Osteoartritis y fisioterapia: el rol del movimiento guiado', 'carousel'],
    ['Osteoartritis cervical: síntomas frecuentes y cuándo consultar', 'post'],
    ['Osteoartritis: diferencias con la artritis reumatoide que es útil conocer', 'post'],
  ],
  espondilitis: [
    ['Espondilitis anquilosante: señales que orientan el diagnóstico temprano', 'post'],
    ['Dolor lumbar inflamatorio vs mecánico: claves para diferenciarlos', 'carousel'],
    ['Espondilitis anquilosante y postura: ejercicios para el cuidado de la columna', 'carousel'],
    ['Diagnóstico de espondilitis anquilosante: estudios habituales que se solicitan', 'post'],
    ['Espondilitis anquilosante: vivir activo con el acompañamiento correcto', 'post'],
    ['HLA-B27 y espondilitis: qué es este marcador genético y qué significa', 'carousel'],
    ['Espondilitis anquilosante y actividad física: una guía práctica', 'post'],
    ['Espondilitis anquilosante y ojos: la uveítis como manifestación a conocer', 'post'],
    ['Sacroileítis: síntoma clave en la evaluación de la espondilitis anquilosante', 'carousel'],
    ['Espondilitis anquilosante: el valor de la consulta reumatológica oportuna', 'post'],
  ],
  bienestar: [
    ['Nutrición antiinflamatoria en enfermedades reumáticas: lo que dice la evidencia', 'carousel'],
    ['Ejercicio y reumatología: cómo el movimiento apoya la salud articular', 'post'],
    ['Sueño y enfermedades reumáticas: por qué el descanso importa', 'post'],
    ['Manejo del dolor crónico: estrategias complementarias validadas', 'carousel'],
    ['Bienestar emocional en enfermedades reumáticas: recursos de apoyo', 'post'],
    ['Omega-3 y articulaciones: evidencia científica actualizada', 'post'],
    ['Temperatura y articulaciones: el impacto del frío en enfermedades reumáticas', 'carousel'],
    ['Hidratación y salud articular: lo básico que conviene recordar', 'post'],
    ['Vitamina D y salud ósea en reumatología: recomendaciones generales', 'carousel'],
    ['Control preventivo en reumatología: por qué la evaluación periódica es clave', 'post'],
  ],
};

/**
 * Returns the ISO week number (1–53) for a given date.
 * Follows ISO 8601: week 1 is the week containing the first Thursday of the year.
 */
function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Returns the 5 rheumatology topics to generate for the given date.
 * Topic selection is deterministic: same date → same topics (safe for retries/idempotency).
 * Rotates through 2 variant sets week-over-week so content doesn't repeat weekly.
 */
export function getDailyTopics(date: Date): RheumatologyTopic[] {
  const dayOfWeek = date.getUTCDay(); // 0=Sunday…6=Saturday (UTC to avoid timezone drift)
  const weekParity = isoWeekNumber(date) % 2; // 0 or 1
  const condition = DAY_CONDITION[dayOfWeek];
  const pool = TOPIC_POOL[condition];

  // Each variant set covers 5 slots; parity selects which set of 5.
  const baseIdx = weekParity * 5;

  return ([1, 2, 3, 4, 5] as const).map((slot) => {
    const [topic, type] = pool[(baseIdx + slot - 1) % pool.length];
    return { topic, condition, type, slot };
  });
}

/**
 * Publish time offsets (in minutes from midnight, local time) for each slot.
 * Slot 5 is scheduled for 10 AM the NEXT day (+34h relative to 7 AM cron).
 */
export const SLOT_PUBLISH_TIMES: Record<1 | 2 | 3 | 4 | 5, { label: string; offsetHours: number }> = {
  1: { label: '9:00 AM (hoy)',          offsetHours: 9 },
  2: { label: '1:00 PM (hoy)',          offsetHours: 13 },
  3: { label: '4:00 PM (hoy)',          offsetHours: 16 },
  4: { label: '7:00 PM (hoy)',          offsetHours: 19 },
  5: { label: '10:00 AM (día siguiente)', offsetHours: 34 },
};

/** Rheumatology hashtag pool, organized by category for coverage guarantees. */
export const RHEUMATOLOGY_HASHTAG_POOL = {
  general: [
    '#Reumatología', '#RheumatologyMatters', '#ArthritisAwareness',
    '#HealthCare', '#SaludArticular', '#EnfermedadesReumáticas',
  ],
  by_condition: {
    artritis_reumatoide: ['#ArtritisReumatoide', '#RAWarrior', '#RAAwareness', '#RA'],
    lupus: ['#LupusWarrior', '#LupusEritematoso', '#LupusAwareness', '#SEL'],
    osteoartritis: ['#Osteoartritis', '#JointHealth', '#SaludArticular', '#OAWarrior'],
    espondilitis: ['#EspondilitisAnquilosante', '#AnkylosingSpondylitis', '#SpinalHealth', '#AS'],
    bienestar: ['#BienestarArticular', '#SaludReumática', '#VidaActiva', '#SaludPreventiva'],
  },
  educational: [
    '#EducaciónMédica', '#SaludChile', '#MedicinaPreventiva',
    '#ConsejosDeSalud', '#PrevencionSalud',
  ],
  geographic: ['#Chile', '#Santiago', '#SaludCL'],
} as const;
