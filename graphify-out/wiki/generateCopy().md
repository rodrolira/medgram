# generateCopy()

> God node · 7 connections · [C:\Users\rlira\Desktop\Rorro\Programacion\medgram\packages\content-pipeline\src\generator.ts](file:///C:/Users/rlira/Desktop/Rorro/Programacion/medgram/packages/content-pipeline/src/generator.ts#L114)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as generateCopy()
    participant P1 as .create()
    participant P2 as .generateAndQueue()
    participant P3 as .findOne()
    participant P4 as .runComplianceCheck()
    participant P5 as runGenerationPipeline()
    participant P6 as .generate()
    participant P7 as .regenerate()
    participant P8 as .markPublishFailed()
    participant P9 as .process()
    participant P10 as createDemo()
    participant P11 as .logTransition()
    participant P12 as bootstrap()
    participant P13 as stubCopy()
    participant P14 as buildSystemPrompt()
    participant P15 as buildUserPrompt()
    participant P16 as parseCopy()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P1->>+ P7: calls
    P7-->>- P1: return
    P7->>+ P3: calls
    P3-->>- P7: return
    P7->>+ P1: calls
    P1-->>- P7: return
    P7->>+ P4: calls
    P4-->>- P7: return
    P7->>+ P5: calls
    P5-->>- P7: return
    P1->>+ P8: calls
    P8-->>- P1: return
    P8->>+ P3: calls
    P3-->>- P8: return
    P8->>+ P1: calls
    P1-->>- P8: return
    P8->>+ P9: calls
    P9-->>- P8: return
    P1->>+ P10: calls
    P10-->>- P1: return
    P1->>+ P11: calls
    P11-->>- P1: return
    P1->>+ P12: calls
    P12-->>- P1: return
    P0->>+ P5: calls
    P5-->>- P0: return
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
- [[.create()]] `INFERRED`
- [[runGenerationPipeline()]] `INFERRED`
- [[stubCopy()]] `EXTRACTED`
- [[buildSystemPrompt()]] `EXTRACTED`
- [[buildUserPrompt()]] `EXTRACTED`
- [[parseCopy()]] `EXTRACTED`

### contains
- [[generator.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*