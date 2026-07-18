# createDemo()

> God node · 4 connections · [C:\Users\rlira\Desktop\Rorro\Programacion\medgram\apps\api\prisma\seed-demo.ts](file:///C:/Users/rlira/Desktop/Rorro/Programacion/medgram/apps/api/prisma/seed-demo.ts#L158)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as createDemo()
    participant P1 as .create()
    participant P2 as generateCopy()
    participant P3 as runGenerationPipeline()
    participant P4 as stubCopy()
    participant P5 as buildSystemPrompt()
    participant P6 as buildUserPrompt()
    participant P7 as parseCopy()
    participant P8 as .generateAndQueue()
    participant P9 as .findOne()
    participant P10 as .runComplianceCheck()
    participant P11 as .generate()
    participant P12 as .regenerate()
    participant P13 as .markPublishFailed()
    participant P14 as .logTransition()
    participant P15 as bootstrap()
    participant P16 as runComplianceChecks()
    participant P17 as main()
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
    P1->>+ P8: calls
    P8-->>- P1: return
    P8->>+ P9: calls
    P9-->>- P8: return
    P8->>+ P1: calls
    P1-->>- P8: return
    P8->>+ P10: calls
    P10-->>- P8: return
    P8->>+ P3: calls
    P3-->>- P8: return
    P8->>+ P11: calls
    P11-->>- P8: return
    P1->>+ P12: calls
    P12-->>- P1: return
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P14: calls
    P14-->>- P1: return
    P1->>+ P15: calls
    P15-->>- P1: return
    P0->>+ P16: calls
    P16-->>- P0: return
    P0->>+ P17: calls
    P17-->>- P0: return
```

## Connections by Relation

### calls
- [[.create()]] `INFERRED`
- [[runComplianceChecks()]] `INFERRED`
- [[main()]] `EXTRACTED`

### contains
- [[seed-demo.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*