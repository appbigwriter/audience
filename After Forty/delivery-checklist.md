# After Forty — executable delivery checklist

Scope: local preparation only. Every unchecked external item requires the named Gate and readback. Never substitute a local fixture, HTTP 401, or documentation for remote evidence

## Database / Control Tower — Théo + Control Tower

- [ ] With explicit Sergio Gate, reconcile `slug=afterforty` before creating anything; do not create a duplicate
- [ ] Read back project UUID, slug, template, status, domain, and `schema_name`
- [ ] Prove `blog_afterforty` exists and list tables; verify RLS/policies and project isolation
- [ ] If absent, submit a non-destructive provisioning/migration proposal for a separate Gate; never apply destructive SQL
- [ ] Store only `secret_ref` and sanitized receipt; no secret values in files/logs

## Frontend — Théo

- [ ] Configure runtime references only; frontend exposes only `NEXT_PUBLIC_*`
- [ ] Read blog configuration from `blog_afterforty`, not hardcoded blog data
- [ ] Verify canonical domain and English rendering
- [ ] Verify ad slots/configuration contract without activating ads or affiliate links
- [ ] Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` in `F:/Projetos/_FBR/FBR Blogs/09-codigo`

## Backend / adapters — Théo

- [ ] Confirm Control Tower/Supabase URL, auth contract, timeout, idempotency, error sanitization, and rollback
- [ ] Exercise fake adapters locally; production mode must fail closed when runtime config is missing
- [ ] Verify schema-qualified reads and no writes to central `public`
- [ ] Capture correlation ID, receipt, actor, timestamp, scope, and sanitized readback after any authorized operation

## GitHub — owner of each repository

- [ ] Inspect `git status`, branch, remote, and diff before any action
- [ ] Obtain a separate explicit Gate before commit/push if not already covered
- [ ] Push only the reviewed package/code scope; record commit SHA and remote readback
- [ ] Confirm no `.env*`, tokens, keys, service-role values, or build artifacts are tracked

## Easypanel — Théo

- [ ] Confirm official API base and project/service names from runtime contract
- [ ] Obtain explicit Gate before create/update/deploy/destroy
- [ ] Inject secrets only through runtime Secret Manager references
- [ ] After authorized deploy, read back service configuration and health; unknown is `NOT_VERIFIED`, never inferred `running`
- [ ] Do not create a permanent service or run the temporary homologation again without its specific Gate

## Domain / DNS — Sergio + Théo

- [ ] Obtain explicit Gate for DNS and public exposure
- [ ] Verify authoritative DNS, TLS certificate, canonical redirect, and HTTP status
- [ ] Read back `https://afterforty.fbr.news`; record public URL and timestamp
- [ ] No DNS change was authorized or executed in this preparation

## Content / Gabe + Gestor Editorial

- [ ] Revalidate six volatile listings/variants before final copy: `B0725JP4TN`, `B0744JV661`, `B00XM2MXK8`, `B01BVACFAK`, `B07978VPPH`, `B002DYIZEE`
- [ ] Preserve exactly 12 IDs, four per category; keep SB-02, SB-04, RW-02, RW-04, HF-01, HF-03 `SEM PRODUTO`
- [ ] Keep E1 ingredient/context separate from E2 listing facts and E3 marketplace perception
- [ ] Confirm every draft has `Sources` with access date and the exact official disclaimer at the end
- [ ] Scan for actual affiliate URLs/HopLinks; add disclosure only if a separately authorized affiliate link is later inserted
- [ ] Obtain a separate explicit dated Sergio Gate before publishing any content or adding affiliate/HopLink URLs

## Smoke test — after authorized public deployment only

- [ ] `curl -I https://afterforty.fbr.news`
- [ ] Open home page and one article per category
- [ ] Confirm HTTPS, canonical URL, title, `Sources`, disclaimer, no leaked secrets, and no broken assets
- [ ] Confirm a second independent GET returns the same deployed version/receipt
- [ ] Record public readback; without it status remains not complete
