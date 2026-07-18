# COMPLIANCE.md — Reglas de contenido médico como código

Fuente de verdad de las reglas que el validador automático (`packages/shared-types`) aplica a **todo** copy antes de que llegue al doctor. Cada regla aquí debe tener su contraparte implementada en código; si se agrega una regla nueva, se agrega primero aquí.

**Principio de diseño:** estas son reglas duras (bloquean el pipeline), no sugerencias de estilo. Un borrador que falla cualquier regla `blocker` **no entra** a `pending_approval`.

## Marco regulatorio

| Fuente | Qué regula |
|---|---|
| Meta — Personal Attributes Policy | Prohíbe asumir/implicar conocer una condición de salud del usuario |
| Meta — Health & Wellness Ads (2026) | Lenguaje diagnóstico, claims sin respaldo, antes/después (incluye transformaciones implícitas) |
| Colegio Médico de Chile — Código de Ética | Publicidad que promete resultados, testimonios engañosos, expectativas sin respaldo clínico |
| Ley 20.584 (Chile) | Contenido que sugiera diagnóstico a distancia o reemplace la consulta médica |

## Reglas

### NO_PERSONAL_ATTRIBUTES — `blocker`
- **Fuente:** Meta Personal Attributes Policy.
- **Prohíbe:** segunda persona + condición/síntoma; asumir que el lector padece algo.
- **Falla:** "¿Sufres de migrañas?", "Si tienes diabetes, esto es para ti", "¿Cansado de tu acné?"
- **Pasa:** "La migraña afecta a cerca del 15% de la población", "Qué es la diabetes tipo 2 y cómo se controla".

### NO_DIAGNOSTIC_LANGUAGE — `blocker`
- **Fuente:** Meta Health Ads + Colegio Médico + Ley 20.584.
- **Prohíbe:** "diagnostica", "cura", "trata", "elimina", "síntomas de X" usados como promesa u oferta del servicio; cualquier sugerencia de diagnóstico por redes.
- **Falla:** "Curamos tu insomnio", "Diagnóstico inmediato por Instagram", "Tratamos los síntomas de la ansiedad".
- **Pasa:** contenido educativo sobre una condición, siempre cerrando con derivación a consulta presencial.

### NO_GUARANTEED_CLAIMS — `blocker`
- **Fuente:** Meta + Colegio Médico.
- **Prohíbe:** "garantizado", "100% efectivo", "resultados inmediatos/instantáneos", "clínicamente probado" sin evidencia citable, "sin riesgos".
- **Falla:** "Resultados garantizados en 7 días", "Método clínicamente probado" (sin cita).
- **Pasa:** "Estudios sugieren que…" con fuente citable en el copy.

### NO_BEFORE_AFTER — `blocker`
- **Fuente:** Meta 2026 (incluye transformaciones **implícitas**).
- **Prohíbe:** describir o mostrar transformaciones (antes/después), incluso implícitas (ej. persona "luciendo saludable" junto al servicio como resultado).
- **Falla:** "Mira cómo quedó María después de 3 sesiones", guiones de carrusel tipo "antes → después".
- **Pasa:** descripción del procedimiento y sus riesgos/beneficios en términos generales.

### NO_REMOTE_DIAGNOSIS — `blocker`
- **Fuente:** Ley 20.584.
- **Prohíbe:** ofrecer evaluación/diagnóstico por DM, comentarios o "cuéntame tus síntomas"; contenido que sustituya la consulta.
- **Falla:** "Mándame DM con tus síntomas y te digo qué tienes".
- **Pasa:** "Agenda una consulta para una evaluación personalizada".

### NO_MISLEADING_TESTIMONIALS — `blocker`
- **Fuente:** Colegio Médico.
- **Prohíbe:** testimonios de pacientes (reales o inventados) usados como evidencia de resultados.
- **Falla:** "Mis pacientes dicen que les cambió la vida".
- **Pasa:** cifras poblacionales de fuentes públicas (MINSAL, OMS) citadas.

### NO_FEAR_URGENCY — `warning`
- **Fuente:** buenas prácticas + espíritu del Código de Ética.
- **Prohíbe:** apelar al miedo o urgencia artificial para empujar la consulta.
- **Falla:** "No esperes a que sea tarde", "Podría ser algo grave, agenda YA".
- **Pasa:** llamados a la acción neutros: "Agenda tu control anual".

### REQUIRED_EDUCATIONAL_DISCLAIMER — `warning` (regla positiva)
- **Fuente:** mitigación Ley 20.584.
- **Exige:** el contenido educativo sobre condiciones de salud debe incluir una variante de "este contenido es informativo y no reemplaza una consulta médica".

## Severidades

- `blocker`: el borrador se rechaza automáticamente, no llega al doctor. Se loguea y vuelve a generación.
- `warning`: el borrador llega al doctor con la advertencia visible en el checklist (rojo/amarillo), para que decida con contexto.

## Estado de implementación

Las 8 reglas están implementadas en `packages/shared-types/src/compliance.ts` (`COMPLIANCE_RULES` + `runComplianceChecks`). La API las ejecuta en `POST /content/:id/compliance-check` y persiste cada resultado en la tabla `compliance_checks`.

> Nota: el chequeo automático **reduce** el riesgo, no lo elimina. El doctor sigue siendo el responsable legal del contenido publicado a su nombre; por eso el gate de aprobación y el log de auditoría son obligatorios.
