# Blueprint: Plataforma de Marketing Médico para Instagram con Aprobación del Doctor

> Documento pensado para pasarle directamente a Claude Code como punto de partida del proyecto (CLAUDE.md / spec inicial). Incluye supuestos explícitos — ajústalos antes de empezar a construir.

## 1. Objetivo

Sistema que automatiza la creación de contenido para Instagram (posts, carruseles, reels/videos) y su publicidad para un médico general, con un **gate de aprobación obligatorio del doctor** antes de que cualquier pieza salga a producción (orgánica o pagada).

**Supuesto de alcance (ajustable):** se construye por fases. Fase 1 = generación + aprobación + publicación manual. Fase 2 = auto-publicación vía API. Fase 3 = gestión de anuncios. Ver sección 9.

## 2. Por qué el gate de aprobación no es opcional (compliance)

Esto no es solo buena práctica — hay marco regulatorio real que hace que la automatización 100% sin supervisión sea una mala idea para contenido médico:

- **Colegio Médico de Chile / Código de Ética:** restringe publicidad que prometa resultados, use testimonios engañosos, o genere expectativas no respaldadas clínicamente.
- **Ley 20.584** (derechos y deberes de los pacientes): cuidado con cualquier contenido que sugiera diagnóstico a distancia o reemplace consulta médica.
- **Políticas de Meta para salud (2026):**
  - *Personal Attributes Policy*: prohíbe que el anuncio asuma o implique conocer una condición de salud del usuario ("¿Sufres de...?", lenguaje en segunda persona sobre síntomas).
  - Prohibido lenguaje diagnóstico ("diagnostica", "síntomas de X", "cura", "trata") salvo con matices muy cuidadosos, y prohibidas palabras como "garantizado", "resultados instantáneos", "clínicamente probado" sin respaldo.
  - Ampliación 2026 de la prohibición de imágenes "antes/después", incluyendo transformaciones *implícitas* (ej. mostrar a alguien luciendo saludable junto al servicio).
  - Anuncios de salud pasan por categorización y restricciones especiales de segmentación; algunas categorías requieren certificación (LegitScript) — no aplica típicamente a un médico general, pero conviene revisarlo si se promocionan tratamientos específicos.
  - Revisión de anuncios es mayormente automática (~24h) pero las cuentas de salud reciben escrutinio más agresivo y los rechazos/restricciones de cuenta son comunes.

**Consecuencia de diseño:** el pipeline de IA debe generar contenido con estas restricciones como reglas duras (no solo sugerencias de estilo), y el dashboard de aprobación debe mostrarle al doctor un checklist de compliance visible junto a cada pieza, no solo el contenido.

## 3. Arquitectura de alto nivel

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Generador IA    │────▶│  Cola de revisión    │────▶│  Dashboard del  │
│  (copy, imagen,  │     │  (pending_approval)  │     │  doctor (web)   │
│  guion video)    │     └──────────────────────┘     └────────┬────────┘
└─────────────────┘                                            │
        ▲                                                      ▼
        │                                          ┌───────────────────────┐
┌───────┴────────┐                                  │ approved / rejected / │
│ Calendario de  │                                  │ needs_changes         │
│ contenido       │                                 └───────────┬───────────┘
│ (planificación) │                                             ▼
└────────────────┘                                  ┌───────────────────────┐
                                                     │ Programador de        │
                                                     │ publicación           │
                                                     └───────────┬───────────┘
                                                                 ▼
                                              ┌──────────────────────────────┐
                                              │ Instagram Graph API          │
                                              │ (Content Publishing API)     │
                                              └──────────────────────────────┘
                                                                 │
                                                                 ▼
                                              ┌──────────────────────────────┐
                                              │ Meta Marketing API (Ads)     │
                                              │ — solo sobre contenido       │
                                              │   ya aprobado                │
                                              └──────────────────────────────┘
```

## 4. Stack recomendado (consistente con tu entorno de Claude Code en Windows)

- **Frontend (dashboard de aprobación + calendario):** Next.js + TypeScript + Tailwind
- **Backend:** NestJS (API REST + jobs)
- **Base de datos:** PostgreSQL
- **Cola/scheduler:** BullMQ + Redis (para publicación programada y reintentos)
- **Almacenamiento de medios:** S3-compatible (o Cloudflare R2) para imágenes/video antes de publicar
- **Generación de contenido IA:**
  - Copy: Claude API
  - Imágenes/carruseles: API de generación de imágenes (ej. vía Claude API + herramienta de imagen, o proveedor dedicado)
  - Video/reels: esto es lo más limitado hoy — evaluar entre (a) generar guion + storyboard con IA y edición humana, o (b) proveedor de video-IA externo. No hay una solución "un clic" confiable todavía para reels médicos con buena calidad.
- **Notificaciones al doctor:** email o WhatsApp (Twilio) cuando hay contenido pendiente de revisión

## 5. Modelo de datos (núcleo)

```
ContentItem
  id, type (post|carousel|reel|ad_creative)
  status: draft -> pending_approval -> (approved | rejected | needs_changes) -> scheduled -> published
  generated_copy, generated_media[], compliance_flags[]
  doctor_comments, approved_by, approved_at
  scheduled_for, published_at, ig_media_id

ComplianceCheck
  content_item_id
  rule (personal_attributes | diagnostic_language | before_after | guaranteed_results | ...)
  passed: boolean, detail

Campaign (fase 3)
  id, objective, budget, content_item_ids[], status, meta_campaign_id

User
  role: agency_admin | doctor_approver
```

## 6. Flujo de aprobación (lo central del sistema)

1. El pipeline de IA genera un borrador (copy + imagen/video + hashtags) y corre un chequeo automático de compliance (reglas de la sección 2) → si falla, no llega al doctor, vuelve a generación.
2. Lo que pasa el chequeo entra a `pending_approval` y el doctor recibe notificación.
3. Doctor ve, en una sola pantalla: preview real de cómo se vería el post/reel, el texto, y el checklist de compliance ya resuelto (verde/rojo por regla).
4. Doctor puede: **Aprobar**, **Rechazar** (con motivo), o **Pedir cambios** (comentario libre que vuelve a IA o a ti para editar).
5. Solo lo aprobado entra al programador de publicación.

## 7. Publicación en Instagram (Content Publishing API) — requisitos reales 2026

- Cuenta de Instagram **Business** (no personal, no Creator para reels vía API) vinculada a una **Página de Facebook**.
- App registrada en Meta for Developers + **Meta App Review** aprobado para los permisos `instagram_business_basic` e `instagram_business_content_publish` (nombres vigentes desde ene-2025; los antiguos `instagram_basic`/`instagram_content_publish` quedaron deprecados). Revisión toma ~2–4 semanas e incluye un screencast del flujo de uso.
- Modelo de publicación: crear un *container* (`POST /{ig-user-id}/media`), esperar a que procese, luego publicar (`POST /{ig-user-id}/media_publish`).
- Reels vía API: `media_type=REELS`, video público accesible por URL, 9:16, 5–90s, H.264/HEVC.
- Rate limits basados en la fórmula de "Business Use Case" de Meta — no es un límite fijo simple, hay que dejar margen en el diseño de la cola.

**Atajo de MVP:** existen capas unificadas de terceros (ej. Blotato, Zernio, Postproxy) que evitan el ciclo de revisión de Meta para publicar más rápido. Trade-off: dependencia de un tercero, costo recurrente, y hay que revisar bien sus términos de manejo de datos antes de conectarlos a la cuenta de un médico — no es un "no", pero requiere due diligence, no es plug-and-play sin revisión.

## 8. Publicidad (Meta Marketing API) — fase 3, con más cuidado aún

- El contenido de anuncios de salud recibe categorización especial y escrutinio más agresivo que contenido orgánico.
- Reglas duras a validar antes de que cualquier ad se active (independiente de la aprobación del doctor sobre el contenido clínico):
  - Sin lenguaje que asuma condición de salud del espectador (2da persona + síntomas).
  - Sin "antes/después" ni transformaciones implícitas.
  - Sin "garantizado", "resultados inmediatos", "clínicamente probado" sin evidencia citable.
  - Segmentación por edad 18+ si se toca cualquier categoría sensible (estética, salud reproductiva, etc.).
- Recomendación: este módulo se construye al final, no en el MVP — es donde más plata y reputación se puede perder por un rechazo o restricción de cuenta.

## 9. Fases sugeridas

| Fase | Alcance | Riesgo/esfuerzo |
|---|---|---|
| 1 | Generación IA + calendario + dashboard de aprobación. Publicación **manual** (el doctor o tú suben lo aprobado) | Bajo — sin depender de Meta App Review |
| 2 | Auto-publicación vía Instagram Graph API (orgánico) | Medio — requiere App Review de Meta (2-4 semanas) |
| 3 | Automatización de anuncios (Meta Marketing API) | Alto — mayor escrutinio de Meta, mayor impacto reputacional si falla |

Empezar por la Fase 1 te da algo usable y vendible en días, no en semanas, y separa "el doctor aprueba contenido" (que es el corazón de tu propuesta de valor) de "la API de Meta coopera" (que no controlas tú).

## 10. Estructura sugerida de proyecto para Claude Code

```
/medgram
  CLAUDE.md                 <- este documento, adaptado
  /apps
    /dashboard (Next.js)
    /api (NestJS)
  /packages
    /content-pipeline        <- generación IA + compliance checks
    /shared-types
  /.claude
    /skills
      compliance-rules-medicas.md
      instagram-content-format.md
    /agents
      content-generator.md
      compliance-checker.md
    /commands
      nuevo-post.md
      revisar-pendientes.md
```

## 11. Riesgos a tener presentes

- No prometas al doctor "publicación 100% automática" en la v1 — la dependencia de Meta App Review es real y fuera de tu control de tiempos.
- El chequeo de compliance automático **reduce** riesgo, no lo elimina — el doctor sigue siendo responsable legal del contenido publicado en su nombre.
- Guarda un log inmutable de quién aprobó qué y cuándo (auditoría) — importante si algo se cuestiona después.
