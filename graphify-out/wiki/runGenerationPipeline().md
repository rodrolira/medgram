# runGenerationPipeline()

> God node · 8 connections · [C:\Users\rlira\Desktop\Rorro\Programacion\medgram\packages\content-pipeline\src\pipeline.ts](file:///C:/Users/rlira/Desktop/Rorro/Programacion/medgram/packages/content-pipeline/src/pipeline.ts#L51)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as runGenerationPipeline()
    participant P1 as generateCopy()
    participant P2 as .create()
    participant P3 as .generateAndQueue()
    participant P4 as .regenerate()
    participant P5 as .markPublishFailed()
    participant P6 as createDemo()
    participant P7 as .logTransition()
    participant P8 as bootstrap()
    participant P9 as stubCopy()
    participant P10 as buildSystemPrompt()
    participant P11 as buildUserPrompt()
    participant P12 as parseCopy()
    participant P13 as runComplianceChecks()
    participant P14 as hasBlockerFailures()
    participant P15 as composeFullCopy()
    participant P16 as formatBlockerFeedback()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P2->>+ P7: calls
    P7-->>- P2: return
    P2->>+ P8: calls
    P8-->>- P2: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P9: calls
    P9-->>- P1: return
    P9->>+ P1: calls
    P1-->>- P9: return
    P1->>+ P10: calls
    P10-->>- P1: return
    P10->>+ P1: calls
    P1-->>- P10: return
    P1->>+ P11: calls
    P11-->>- P1: return
    P1->>+ P12: calls
    P12-->>- P1: return
    P0->>+ P3: calls
    P3-->>- P0: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P0->>+ P13: calls
    P13-->>- P0: return
    P0->>+ P14: calls
    P14-->>- P0: return
    P0->>+ P15: calls
    P15-->>- P0: return
    P0->>+ P16: calls
    P16-->>- P0: return
```

## Connections by Relation

### calls
- [[generateCopy()]] `INFERRED`
- [[.generateAndQueue()]] `INFERRED`
- [[.regenerate()]] `INFERRED`
- [[runComplianceChecks()]] `INFERRED`
- [[hasBlockerFailures()]] `INFERRED`
- [[composeFullCopy()]] `EXTRACTED`
- [[formatBlockerFeedback()]] `EXTRACTED`

### contains
- [[pipeline.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*