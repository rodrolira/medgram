# Blueprint v2.0: Plataforma de Marketing Médico para Instagram con IA Generativa + WhatsApp Booking

> Documento actualizado para incluir generación IA completa (texto + imagen + video), 5 publicaciones diarias, hashtags automáticos, especialidad reumatología, y sistema de agendación por WhatsApp.

## 1. Objetivo general

Plataforma que:
- Genera **5 publicaciones diarias** automáticamente (posts, carruseles, reels) sobre **reumatología**
- Usa IA generativas (texto, imagen, video) con opciones **100% gratuitas**
- Todas las publicaciones incluyen **hashtags médicos relevantes**
- Gate de aprobación obligatorio del doctor antes de publicar
- Integración con **WhatsApp** para que pacientes agenden citas directamente desde Instagram
- Automatiza la publicación a Instagram
- Dashboard unificado para doctor: revisar, aprobar, ver estadísticas, gestionar calendarios

---

## 2. Stack de IA Generativas (Opciones Gratuitas)

### 2.1 Generación de Texto (Copy)
**Opción primaria: Claude API**
- Tu propia API key de Anthropic
- 1.5M tokens diarios en free tier (suficiente para 5 posts diarios + copy adicional)
- Alternativa: Groq API (más rápido, pero menos sofisticado para medical copy)

**Prompt template para Claude:**
```python
# pseudo-código
prompt = f"""
Eres un especialista en marketing médico para un doctor que trata reumatología.
Objetivo: Crear un post de Instagram (150-200 palabras) sobre: {tema_reumatologia}

RESTRICCIONES (OBLIGATORIAS - no violar):
1. NO asumir condiciones de salud del lector ("¿Tienes artritis?", "sufres de")
2. NO usar "diagnostica", "cura", "síntomas" sin contexto médico explícito
3. NO "garantizado", "100% efectivo", "resultados instantáneos"
4. NO "antes/después" o transformaciones visuales
5. NO superlativas sin evidencia ("único", "mejor")
6. SÍ usar valor educativo: tips, síntomas a vigilar, cuándo consultar
7. Incluye: CTA suave ("Consulta con un especialista", "Agenda tu evaluación")
8. Tono: profesional, accesible, empático

SALIDA REQUERIDA (JSON):
{{
  "copy": "[texto del post]",
  "hashtags": ["#reumatologia", "#salud", ...],
  "content_type": "post|carousel|reel",
  "compliance_warnings": []
}}
"""
```

**Temas de reumatología pre-definidos (5 diarios):**
- Lunes: Artritis reumatoide (síntomas, tratamientos)
- Martes: Lupus (QoL, manejo del estrés)
- Miércoles: Osteoartritis (prevención, ejercicio)
- Jueves: Espondilitis anquilosante (diagnóstico temprano)
- Viernes: Consejos de bienestar reumatológico (nutrición, ejercicio)
- (Ciclo se repite, con variaciones semana a semana)

---

### 2.2 Generación de Imágenes
**Opción primaria: Hugging Face (Stable Diffusion 3.5 / FLUX.1 Schnell)**
- Completamente gratuito via Spaces (queue/espera)
- O descarga local gratis si tienes GPU NVIDIA

**Fallback (sin GPU): Pollinations.ai**
- Endpoint público, sin signup
- Rate limit bajo (~1-2 req/min) pero suficiente para 5 diarias

**Prompt para imagen médica (adaptado):**
```
Medical illustration, minimal design, professional:
[tema: ej. "inflamación articular", "anatomía de la rodilla"]
Estilo: infografía médica, colores: azul/blanco/gris
Sin personas, no antes/después, educational style
```

**Flow en el código:**
```python
# 1. Generar prompt de imagen con Claude
image_prompt = generate_image_prompt(tema_reumatologia)

# 2. Llamar Hugging Face Spaces (con reintentos)
image_url = call_huggingface_stable_diffusion(image_prompt, max_retries=3)

# 3. Descargar y guardar en S3
image_local = download_image(image_url)
upload_to_s3(image_local, content_item_id)

# 4. Integrar a ContentItem.media_urls[]
```

**Herramientas del stack:**
- Hugging Face Inference API (Spaces): `https://huggingface.co/[space-name]`
- Alternativa: Replicate.com (50 imágenes/mes gratis, buena para fallback)
- Alternativa sin GPU: Pollinations.ai (`https://api.pollinations.ai/v1/images`)

---

### 2.3 Generación de Video / Reels

**Realidad 2026:** No hay una solución "un clic" realmente gratuita para video de calidad médica.

**Opción recomendada (híbrida):**

**A) Guion + Video corto (animación simple)**
1. Claude genera guion (30-45 segundos, máx 80 palabras)
2. Usa una herramienta gratuita de video:
   - **Descript** (free tier: 1 video/mes): subes texto → auto-genera video con transiciones
   - **Runway Gen-3** (free tier: 5 min/mes): genera video desde texto
   - **Synthesia** (free trial: 1 video) — hablador + slides
3. Alternativa manual: crear storyboard (imágenes Stable Diffusion) + audio TTS → montaje simple

**B) Open-source (si tienes GPU local)**
- **Wan 2.2 (Alibaba)** — corre localmente, sin límites
- **HunyuanVideo** — 8.3B params, corre en 24GB VRAM
- **Open-Sora** — replica Sora, open-source
- Requiere: GPU NVIDIA H100 o A100 (~4-8 horas de cómputo por video)

**Para MVP (Fase 1):**
Saltá videos. Usa **carousels** (imagen + texto) que cumplen el rol de "contenido multi-panel" sin las complejidades de video. Posts + carousels = 80% del engagement, sin headaches de generación de video.

**Para Fase 2 (cuando tengas presupuesto):**
Integra Descript o un servicio de video-IA pagado ($15-50/mes).

---

### 2.4 Hashtags automáticos (contexto reumatología)

**Pool de hashtags médicos pre-definidos:**
```python
hashtags_reumatologia = {
    "generales": [
        "#Reumatología", "#RheumatologyMatters", "#ArthritisAwareness",
        "#HealthCare", "#MedicalAdvice", "#SaludArticular"
    ],
    "por_condición": {
        "artritis_reumatoide": [
            "#ArthritisRheumatoid", "#RA", "#RAWarrior", "#RAAwareness"
        ],
        "lupus": [
            "#LupusWarrior", "#SystemicLupus", "#LupusAwareness", "#SEL"
        ],
        "osteoartritis": [
            "#Osteoarthritis", "#OAWarrior", "#JointHealth", "#OsteoarthritisAwareness"
        ],
        "espondilitis": [
            "#SpinylitisAnkylosans", "#AnkylosingSpondylitis", "#SpinalHealth"
        ]
    },
    "educativos": [
        "#MédicalEducation", "#HealthTips", "#BienestarArticular",
        "#PrevencionSalud", "#ConsejosDeS alud"
    ],
    "geográficos": [
        "#Chile", "#Santiago", "#Salud_CL", "#MédicoCL"
    ]
}

# Selección automática: 1 general + 2-3 por condición + 2 educativos + 1 geográfico = 8-10 hashtags
```

**Inserción en copy:**
```
[Texto del post]

---
#Reumatología #ArthritisAwareness [+ 6-8 más según tema]
```

---

## 3. Generación de 5 publicaciones diarias

### 3.1 Scheduler automático
```python
# apps/api/src/scheduler/daily-content-generator.ts

import { CronJob } from 'cron';
import { ContentGeneratorService } from './content-generator.service';

// Ejecuta a las 7 AM (antes que el doctor se despierte)
const dailyContentJob = new CronJob('0 7 * * *', async () => {
  const temas = getTemasDiaDeHoy(); // Ej: 5 temas distintos

  for (const tema of temas) {
    try {
      // 1. Generar texto + hashtags
      const { copy, hashtags, content_type } =
        await claudeAPI.generate(tema);

      // 2. Generar imagen
      const image_url = await huggingfaceAPI.generateImage(tema);

      // 3. Compliance check automático
      const checks = await complianceChecker.run(copy);

      if (checks.every(c => c.passed)) {
        // 4. Crear ContentItem
        const item = await contentService.create({
          type: content_type,
          copy,
          hashtags,
          media_urls: [image_url],
          status: 'pending_approval',
          scheduled_for: getNextPublishTime(index) // Distribuir a lo largo del día
        });

        // 5. Notificar al doctor
        await notificationService.emailDoctor(
          `Nueva publicación pendiente: ${tema}`,
          item.id
        );
      } else {
        // Si falla compliance, reintentar con Claude (ajustar prompt)
        console.warn(`Compliance failed for ${tema}, retrying...`);
        // retry logic aquí
      }
    } catch (error) {
      console.error(`Failed to generate content for ${tema}:`, error);
      // Log en DB para revisión manual
    }
  }
});

dailyContentJob.start();
```

### 3.2 Distribución horaria
```
5 posts generados a las 7 AM, publicados en horarios optimizados:
- Post 1: 9:00 AM (llegada al trabajo)
- Post 2: 1:00 PM (almuerzo)
- Post 3: 4:00 PM (post-trabajo)
- Post 4: 7:00 PM (noche)
- Post 5: 10:00 AM (día siguiente) [si doctor no aprueba antes, entra a cola]

Variable: doctor puede re-agendar con 1 click
```

---

## 4. Flujo de aprobación (igual que v1, pero optimizado)

```
1. Generación IA (7 AM)
   ↓
2. Compliance check automático (instantáneo)
   ├─ Pasa → pending_approval
   └─ Falla → reintentar o marcar para revisión manual
   ↓
3. Notificación al doctor (email + WhatsApp)
   "5 publicaciones nuevas esperan tu aprobación"
   ↓
4. Dashboard: doctor ve lista de 5
   Cada una muestra:
   - Preview real de cómo se vería en Instagram
   - Copy + hashtags
   - Checklist de compliance (✓ o ✗ por regla)
   - Botones: Aprobar | Rechazar | Editar
   ↓
5. Doctor aprueba (o edita)
   ↓
6. Publicación automática vía Instagram Graph API
   (o manual si aún no tenés App Review de Meta)
```

---

## 5. Integración WhatsApp para agendar citas

### 5.1 Flujo de usuario
```
1. Cliente ve publicación en Instagram (post/carousel/reel)
2. Hace clic en CTA: "Agendar consulta"
3. Redirige a WhatsApp (enlace wa.me o botón de Meta)
4. Conversation abierta con el número del doctor
5. Flujo automático (Meta WhatsApp Flows):
   - "Hola, ¿cuándo te gustaría agendar?"
   - Cliente selecciona servicio (consulta inicial, seguimiento, etc.)
   - Calendario de disponibilidad del doctor
   - Cliente selecciona horario
   - Confirmación automática
   - Recordatorio 24h antes
```

### 5.2 Stack técnico (Twilio + Meta WhatsApp Flows)

**Requisitos:**
- Número de teléfono de WhatsApp Business (doctor)
- Cuenta Twilio con WhatsApp Business API habilitada
- Meta Business Manager account
- Google Calendar sincronizado con disponibilidad del doctor

**Endpoints:**
```typescript
// apps/api/src/whatsapp/booking.controller.ts

@Post('/webhook/whatsapp')
async handleWhatsAppMessage(@Body() payload) {
  // Payload de Twilio
  const { From, Body } = payload;

  // Si es "agendar" → trigger WhatsApp Flow
  if (Body.toLowerCase().includes('agendar')) {
    await twilio.sendWhatsAppFlow({
      to: From,
      flowId: 'appointment_booking_flow',
      data: {
        doctor_name: 'Dr. [Nombre]',
        available_slots: getAvailableSlots() // desde Google Calendar
      }
    });
  }
}

@Post('/webhook/whatsapp/flow-completion')
async handleFlowCompletion(@Body() payload) {
  // Meta manda el resultado del flow
  const { appointment_date, appointment_time, patient_phone } = payload;

  // Guardar en DB
  const booking = await bookingService.create({
    doctor_id: doctor.id,
    patient_phone,
    scheduled_for: parseDateTime(appointment_date, appointment_time),
    source: 'whatsapp'
  });

  // Enviar confirmación
  await twilio.sendWhatsAppMessage({
    to: patient_phone,
    body: `Tu cita ha sido agendada para ${appointment_date} a las ${appointment_time}. Recibirás un recordatorio 24h antes.`
  });

  // Crear evento en Google Calendar del doctor
  await googleCalendar.createEvent({
    summary: `Consulta - ${patient_phone}`,
    start: booking.scheduled_for,
    attendees: [doctor.email]
  });
}
```

**Alternativa simplificada (sin Meta Flows):**
- Link wa.me directo en cada publicación
- Bot Twilio simple que responde preguntas frecuentes
- Doctor gestiona agendación manualmente (o integra Calendly)

---

## 6. Modelo de datos (v2 actualizado)

```sql
-- ContentItem (igual que v1)
CREATE TABLE content_items (
  id UUID PRIMARY KEY,
  doctor_id UUID NOT NULL,
  type VARCHAR(20), -- 'post' | 'carousel' | 'reel'
  copy TEXT NOT NULL,
  hashtags TEXT[], -- array de strings
  media_urls TEXT[], -- URLs a imágenes/videos en S3
  status VARCHAR(30), -- 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'needs_changes' | 'scheduled' | 'published'
  generated_by VARCHAR(20), -- 'claude_api' | 'manual'
  doctor_comments TEXT,
  approved_by UUID,
  approved_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  published_at TIMESTAMP,
  instagram_media_id VARCHAR(255), -- del Content Publishing API
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ComplianceCheck (igual que v1)
CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY,
  content_item_id UUID NOT NULL REFERENCES content_items(id),
  rule VARCHAR(100),
  passed BOOLEAN,
  detail TEXT,
  created_at TIMESTAMP
);

-- NEW: Booking (para citas via WhatsApp)
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_phone VARCHAR(20),
  patient_name VARCHAR(255),
  scheduled_for TIMESTAMP,
  status VARCHAR(20), -- 'confirmed' | 'cancelled' | 'completed'
  source VARCHAR(20), -- 'whatsapp' | 'instagram' | 'web'
  google_calendar_event_id VARCHAR(255),
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- NEW: DailyContentLog (tracking)
CREATE TABLE daily_content_logs (
  id UUID PRIMARY KEY,
  doctor_id UUID NOT NULL,
  date DATE,
  total_generated INT,
  total_approved INT,
  total_published INT,
  created_at TIMESTAMP
);
```

---

## 7. Restricciones de compliance (reforzadas para reumatología)

```python
compliance_rules = {
    "NO_PERSONAL_ATTRIBUTES": {
        "patterns": [r"\btienes\b", r"\bsufres\b", r"\bpadeced", r"\b¿tu\b", r"\btu dolor\b"],
        "ejemplo_falla": "¿Tienes artritis? Nosotros podemos ayudarte",
        "descripcion": "No asumir condición de salud del lector"
    },
    "NO_DIAGNOSTIC_LANGUAGE": {
        "patterns": [r"\bdiagnostica", r"\bcura\b", r"\bcured", r"\bsíntomas de\b"],
        "ejemplo_falla": "Cura tu artritis con nuestro tratamiento",
        "descripcion": "Lenguaje diagnóstico sin contexto médico explícito"
    },
    "NO_GUARANTEED_CLAIMS": {
        "patterns": [r"\bgarantizado\b", r"\b100% efectivo\b", r"\bresultados inmediatos\b"],
        "ejemplo_falla": "Resultados garantizados en 2 semanas",
        "descripcion": "Sin promesas de resultados"
    },
    "NO_BEFORE_AFTER": {
        "patterns": [r"\bantes/después\b", r"\btransformación\b", r"\brecuperación total\b"],
        "descripcion": "Sin comparativas visuales o de transformación"
    },
    "MUST_HAVE_CTA": {
        "required": True,
        "ejemplo": "Agenda tu consulta", "Habla con un especialista",
        "descripcion": "Debe tener call-to-action claro pero no agresivo"
    },
    "MEDICAL_ACCURACY": {
        "source": "validated_medical_database",
        "descripcion": "Copy debe ser clínicamente exacto (basado en pool de temas validados)"
    }
}
```

---

## 8. Stack técnico final (v2)

| Componente | Tecnología | Gratuito |
|---|---|---|
| **Generación de texto** | Claude API | Sí (1.5M tokens/día) |
| **Generación de imágenes** | Hugging Face Spaces + Stable Diffusion 3.5 | Sí (con queue) |
| **Generación de video** | Descript (Fase 2) o skip en MVP | Parcial (1/mes gratis, $15+/mes productivo) |
| **Base de datos** | PostgreSQL | Sí (self-hosted) |
| **Almacenamiento media** | S3 o Cloudflare R2 | Parcial ($0.015/GB) |
| **Scheduler** | BullMQ + Redis | Sí |
| **Instagram API** | Meta Content Publishing API | Sí (app review requerida) |
| **WhatsApp** | Twilio + Meta WhatsApp Flows | Parcial ($0.005-0.015/mensaje) |
| **Google Calendar** | Google Calendar API | Sí |
| **Frontend (dashboard)** | Next.js 14 + Tailwind | Sí |
| **Backend (API)** | NestJS | Sí |
| **Hosting** | Tu VPS Windows / Docker | Depends |

**Costo mensual estimado en producción (MVP):**
- Twilio WhatsApp: ~$50-200 (según volumen de mensajes)
- S3/R2 storage: ~$5-20
- Hosting: $20-100 (VPS)
- **Total: $75-320/mes**

---

## 9. Fases de desarrollo

### Fase 1 (MVP - 4-6 semanas)
- Estructura + generación IA (texto + imagen)
- Dashboard de aprobación
- Publicación manual a Instagram (sin API)
- Compliance checks automáticos
- Email notifications al doctor

### Fase 1.5 (2 semanas)
- WhatsApp agendar citas (manual del doctor, sin flows)
- Google Calendar sync básico

### Fase 2 (4 semanas, post App Review de Meta)
- Auto-publicación a Instagram via Graph API
- Meta WhatsApp Flows integrados
- Recordatorios automáticos

### Fase 3 (después)
- Generación de reels (video)
- Meta Marketing API para ads
- Análisis de engagement

---

## 10. Checklist de MVP (Fase 1)

- [ ] Generar 5 posts diarios automáticamente (Claude API)
- [ ] Generar imágenes para cada post (Stable Diffusion via Hugging Face)
- [ ] Hashtags automáticos + contexto reumatología
- [ ] Compliance checks (7 reglas hardcoded)
- [ ] Dashboard doctor: ver 5 pendientes, aprobar/rechazar/comentar
- [ ] Guardar aprobaciones en DB (auditoría)
- [ ] Email notification al doctor cuando hay nuevas publicaciones
- [ ] Email notification cuando doctor aprueba/rechaza
- [ ] Temas reumatología validados (5 temas base, variaciones semana a semana)
- [ ] Test E2E: generar → compliance → approve → log

**No en MVP:**
- Publicación a Instagram (llega en Fase 2, post-App Review)
- WhatsApp flows (Fase 1.5)
- Video/reels
- Ads

---

## 11. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Meta App Review tarda 4-6 semanas | Alto | MVP funciona sin publicación automática (manual es suficiente) |
| Claude API key costs | Medio | Monitorear tokens; límite suave en 1.5M/día |
| Hugging Face queue lenta | Bajo | Fallback a Pollinations.ai o mantener 1-2 imágenes de stock |
| Video generation es compleja | Medio | Skip en MVP; usar carousels como "featured content" |
| Compliance false positives | Medio | Conservative rules; doctor revisa todo antes anyway |
| WhatsApp integración requiere Twilio $$$ | Medio | Opción manual (link wa.me) en Fase 1.5 |

---

## 12. Instrucciones para Claude Code

Cuando empieces con Claude Code:

1. Copia este CLAUDE.md completo a `/medgram/CLAUDE.md`
2. Usa TASKS.md para las tareas de Fase 1
3. En el prompt, menciónale a Claude Code:
   - "Eres especialista en marketing médico + compliance"
   - "Restringe compliance a código, no sugerencias"
   - "Temas reumatología vienen pre-validados"
   - "5 posts diarios, distribuidos a lo largo del día"
   - "Hashtags son automáticos, no hardcodeados"

---

**Última revisión:** [Tu fecha]
**Versión:** 2.0 (Generación IA completa + WhatsApp booking)
