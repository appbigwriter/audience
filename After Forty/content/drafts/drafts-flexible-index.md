---
title: "AF-001 Flexible Conditional Drafts Index"
version: "1.0"
status: "DRAFTS_COMPLETE_PENDING_GABE_REVIEW_AND_SERGIO_GATE"
agent: "Caio"
card: "AF-001"
created_at: "2026-09-12"
language: "English"
---

# AF-001 — flexible conditional drafts index

## Delivery status

Seven new local English drafts were created for the exact IDs requested. Six use only the authorized ASINs from the Editorial Manager decision as educational/comparative examples. SB-02 is explicitly SEM PRODUTO. The five earlier drafts were not rewritten. No publication, spend, purchase, offer change, HopLink, affiliate URL, or infrastructure mutation was performed.

| ID | Status | Association | Authorized ASIN(s) | File |
|---|---|---|---|---|
| SB-01 | DRAFT_CREATED — PASS_CONDITIONAL — GABE_REVIEW_REQUIRED | Educational/comparative label reading | B0725JP4TN | `SB-01-retinol-label-reading-after-40.md` |
| SB-02 | DRAFT_CREATED — REFRAME — SEM PRODUTO — GABE_REVIEW_REQUIRED | General, non-diagnostic education | None | `SB-02-simple-skincare-routine-without-product.md` |
| SB-03 | DRAFT_CREATED — PASS_CONDITIONAL — GABE_REVIEW_REQUIRED | Educational/comparative listing fields | B0744JV661; B0725JP4TN | `SB-03-comparing-retinol-moisturizer-listings.md` |
| RW-01 | DRAFT_CREATED — PASS_CONDITIONAL — GABE_REVIEW_REQUIRED | Educational/comparative product attributes | B00XM2MXK8 | `RW-01-foam-roller-features-and-questions.md` |
| RW-03 | DRAFT_CREATED — PASS_CONDITIONAL — GABE_REVIEW_REQUIRED | Educational/comparative listing fields | B00XM2MXK8; B01BVACFAK | `RW-03-comparing-foam-roller-listings.md` |
| HF-02 | DRAFT_CREATED — PASS_CONDITIONAL — GABE_REVIEW_REQUIRED | Educational/comparative creatine listing literacy | B07978VPPH | `HF-02-reading-a-creatine-listing-after-40.md` |
| HF-04 | DRAFT_CREATED — PASS_CONDITIONAL — GABE_REVIEW_REQUIRED | Educational/comparative creatine listing fields | B07978VPPH; B002DYIZEE | `HF-04-comparing-creatine-listings-without-ranking.md` |

## Controls applied

- E1 context is kept separate from E2 listing facts and attributed manufacturer/seller language; no E1 source is used as proof of a SKU
- Any product claim is attributed to the listing and dated; where applicable the draft states that no completed standardized independent study confirming the claim for the SKU was located or verified within the 2026-09-12 review scope
- SB-02 contains no product, ASIN, retailer, product URL, or affiliate offer
- No treatment, cure, pain-relief, accelerated-recovery, superiority, universal-safety, guaranteed-cognition, individual-result, or promise language is used as an editorial claim
- Every draft has title, Hook, Context, development sections, Sources with URLs and access date 2026-09-12, and the exact official disclaimer as its final text
- No HopLinks or affiliate URLs were inserted; therefore no promotional disclosure was added
- Existing drafts SB-04, RW-02, RW-04, HF-01, and HF-03 were preserved byte-for-byte

## Handoff — Gabe

```yaml
de: "Caio"
para: "Gabe"
card: "AF-001"
objetivo do job: "Execute Revisão G3 on seven local conditional English drafts for exact ID scope, E1/E2 separation, attributed claims, source fit, prohibited-claim controls, exact disclaimer, and SEM PRODUTO status"
entregável: "F:/Projetos/_FBR/FBR Agency Flux/08-historico/afterforty/drafts/drafts-flexible-index.md and the seven new Markdown drafts — version 1.0"
decisões/suposições:
  - "FATO: exactly seven new IDs are listed: SB-01, SB-02, SB-03, RW-01, RW-03, HF-02, HF-04"
  - "DECISÃO: SB-02 remains SEM PRODUTO"
  - "FATO: only the six authorized ASINs from the Editorial Manager matrix are used"
  - "DECISÃO: listing/manufacturer claims remain E2 attributed and are not SKU proof"
  - "FATO: no affiliate URL, HopLink, publication, spend, purchase, or external mutation occurred"
pendências/blockers:
  - "Gabe — alta — return pass/fail and evidence-backed corrections per ID"
  - "Rick — alta — revalidate variant, label, and volatile listing facts before any final copy decision"
  - "Gestor Editorial — média — resolve any returned title, scope, or association correction"
  - "Sergio — crítica — explicit dated Gate remains required for publication, spend, purchase, HopLink, or mutation"
gate: "revisão — G3 conditional drafts; external execution blocked"
critérios de aceite/evidência:
  - "Each new file maps one-to-one to one requested ID and no other new ID exists"
  - "SB-02 has no product or ASIN; the other six use only authorized ASINs"
  - "Each factual listing statement is E2-attributed, dated, and separated from E1 context"
  - "Each draft contains Sources and the exact official disclaimer as final text"
  - "No affiliate URL or prohibited promise appears"
```

## Handoff — Gestor Editorial

```yaml
de: "Caio"
para: "Gestor Editorial"
card: "AF-001"
objetivo do job: "Receive seven local conditional drafts exactly within the editorial association matrix, preserve SB-02 SEM PRODUTO, and route the package to G3 without inferring publication approval"
entregável: "F:/Projetos/_FBR/FBR Agency Flux/08-historico/afterforty/drafts/drafts-flexible-index.md and seven new English drafts — version 1.0"
decisões/suposições:
  - "FATO: SB-01, SB-03, RW-01, RW-03, HF-02, and HF-04 use only authorized listings as educational/comparative examples"
  - "FATO: SB-02 is SEM PRODUTO and has no SKU, retailer, or affiliate URL"
  - "DECISÃO: no ranking, superiority, personal outcome, or universal-safety statement is editorially permitted"
  - "FATO: existing five drafts were not changed"
  - "LIMITAÇÃO: local drafts are conditional and do not equal Gabe acceptance or Sergio authorization"
pendências/blockers:
  - "Gestor Editorial — alta — preserve exact IDs, associations, and conditional framing during editorial edits"
  - "Gabe — alta — complete G3 readback before any later Gate"
  - "Rick — alta — revalidate six listing variants and volatile fields"
  - "Sergio — crítica — authorize any external action only through a separate dated Gate"
gate: "revisão — editorial/G3 conditional package; publication and mutation blocked"
critérios de aceite/evidência:
  - "Index contains exactly seven new IDs and status for each"
  - "SB-02 remains SEM PRODUTO"
  - "All six ASINs used are in the authorized matrix/readback set"
  - "Five prior drafts remain byte/hash unchanged"
  - "No draft contains a HopLink or affiliate URL"
```

## Handoff — Rick

```yaml
de: "Caio"
para: "Rick / Amazon Research"
card: "AF-001"
objetivo do job: "Revalidate only the six authorized Amazon listing identities, selected variants, labels, serving or attribute fields, warnings when observed, and volatile facts without commercial mutation"
entregável: "A dated local readback covering B0725JP4TN, B0744JV661, B00XM2MXK8, B01BVACFAK, B07978VPPH, and B002DYIZEE"
decisões/suposições:
  - "FATO: the six ASINs are the only product identifiers allowed in these drafts"
  - "DECISÃO: listings are educational/comparative evidence only, not product approval"
  - "FATO: E2 supports identity, displayed fields, and attributed listing claims, not independent efficacy"
  - "DECISÃO: no ASIN may be added to SB-02"
pendências/blockers:
  - "Rick — alta — confirm exact variant and current label before final copy approval"
  - "Rick — média — mark price, stock, reviews, seller, and availability as volatile snapshots"
  - "Rick — crítica — do not generate HopLinks, buy, apply, publish, alter offers, or spend"
  - "Gabe — alta — review the readback against each draft"
gate: "revisão — E2 listing evidence for G3; no external execution"
critérios de aceite/evidência:
  - "Each authorized ASIN appears with URL, variant, access date, and limitations"
  - "Unobserved fields remain NOT_VERIFIED"
  - "Commercial claims remain attributed to the listing"
  - "No SKU or product identifier appears in SB-02"
```

## Handoff — Íris

```yaml
de: "Caio"
para: "Íris"
card: "AF-001"
objetivo do job: "Orchestrate the seven-draft local package to G3 while preserving the exact association decision, the five prior files, and the external-action block"
entregável: "F:/Projetos/_FBR/FBR Agency Flux/08-historico/afterforty/drafts/drafts-flexible-index.md and seven new drafts — local only"
decisões/suposições:
  - "FATO: seven requested IDs have one local draft each"
  - "DECISÃO: SB-02 is SEM PRODUTO; six other IDs use only authorized ASIN examples"
  - "FATO: the exact disclaimer and dated Sources are present in every new draft"
  - "FATO: five pre-existing drafts were preserved byte-for-byte"
  - "LIMITAÇÃO: G3 review and Sergio Gate are still pending"
pendências/blockers:
  - "Íris — alta — route the package and status without inferring acceptance"
  - "Gabe — alta — perform per-ID G3 review"
  - "Rick — alta — revalidate listing evidence"
  - "Gestor Editorial — média — resolve editorial returns"
  - "Sergio — crítica — approve any publication, spend, purchase, HopLink, or mutation separately"
gate: "revisão — G3 conditional; return required before advancement"
critérios de aceite/evidência:
  - "Seven IDs, six authorized ASINs maximum, and SB-02 SEM PRODUTO are explicit"
  - "Owners and blockers are explicit"
  - "No status is interpreted as publication approval"
```

## Handoff — Kora

```yaml
de: "Caio"
para: "Kora"
card: "AF-001"
objetivo do job: "Register the local seven-draft delivery, statuses, paths, preservation evidence, and pending owners without creating external records or mutating infrastructure"
entregável: "F:/Projetos/_FBR/FBR Agency Flux/08-historico/afterforty/drafts/drafts-flexible-index.md — version 1.0"
decisões/suposições:
  - "FATO: exactly seven new draft IDs were created and indexed"
  - "FATO: five earlier article files remain byte/hash unchanged"
  - "FATO: SB-02 has no product and the other six use only the six authorized ASINs"
  - "FATO: no HopLink, affiliate URL, publication, purchase, spend, or infrastructure mutation occurred"
  - "DECISÃO: package status is DRAFTS_COMPLETE_PENDING_GABE_REVIEW_AND_SERGIO_GATE"
pendências/blockers:
  - "Kora — alta — record paths, version, status, hashes, and validation readback"
  - "Gabe — alta — complete G3 review"
  - "Rick — alta — revalidate six listings"
  - "Gestor Editorial — média — resolve returned edits"
  - "Sergio — crítica — dated explicit Gate required for all external action"
gate: "revisão — local G3 conditional package; external execution blocked"
critérios de aceite/evidência:
  - "Filesystem readback confirms seven new article files plus this index"
  - "Programmatic validation confirms approximately 900–1,200 words per draft, Sources, dated URLs, and exact final disclaimer"
  - "Programmatic validation confirms no affiliate URL or HopLink"
  - "Hash readback confirms all five earlier drafts are unchanged"
  - "Registration does not infer Gabe acceptance or Sergio authorization"
```
