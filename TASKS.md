# Medgram — Lista de Tareas

## Fase 1 (MVP — completadas antes del sprint IA)

- ✅ 1️⃣ Modelo de datos Prisma (ContentItem, ComplianceCheck, ContentStatusLog, User)
- ✅ 2️⃣ Reglas de compliance como código (`packages/shared-types`)
- ✅ 3️⃣ Content Service: crear borrador, chequeo, aprobación, rechazo, pedir cambios
- ✅ 4️⃣ Pipeline de generación IA: Claude API + fallback stub (`packages/content-pipeline`)
- ✅ 5️⃣ NotificationService: email al doctor (SMTP o log simulado)
- ✅ 6️⃣ PublishingModule: BullMQ scheduler + StubInstagramPublisher + auditoría
- ✅ 7️⃣ Test E2E completo: generar → compliance → aprobar → programar → publicar → regenerar

## Fase 1 con IA generativa (sprint actual)

- ✅ 8️⃣ **Daily Content Generator** — Scheduler (7 AM) que genera 5 posts diarios de reumatología con temas del pool rotativo, distribuye horarios y notifica al doctor en lote.
- ✅ 9️⃣ **Generación de imágenes** — Integración con HuggingFace (Stable Diffusion) + fallback a Pollinations.ai; media guardada en `generatedMedia` del ContentItem.
- ✅ 🔟 **Hashtag pool refinado** — Pool estructurado de hashtags de reumatología por condición; inyectados en el prompt del generador para garantizar cobertura mínima.
- ✅ 1️⃣1️⃣ **WhatsApp booking** — Webhook Twilio + flujo de agendación de citas; degradación graceful sin credenciales. 25 tests unitarios.
- ✅ 1️⃣2️⃣ **Tests E2E nuevas funcionalidades** — Pasos 11-13 en e2e.mjs: hashtags en copy, generatedMedia en daily generator y webhook WhatsApp. (Requieren Docker + DB para ejecutar.)

## Reglas de implementación

- Compliance es HARDCODE (no sugerencias IA)
- Temas de reumatología vienen de pool pre-validado (no generados por IA)
- 5 posts diarios, distribuidos en slots: 9 AM, 1 PM, 4 PM, 7 PM, 10 AM (día siguiente)
- Hashtags automáticos del pool — no hardcodeados por post individual
