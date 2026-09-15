# After Forty — technical delivery package

Status: `LOCAL_PACKAGE_READY_REMOTE_VERIFICATION_BLOCKED`
Project: After Forty by Heidi Braun
Slug: `afterforty`
Expected domain: `afterforty.fbr.news`
Expected schema: `blog_afterforty`

This package is a non-public, local delivery bundle. It does not provision a schema, deploy a service, alter DNS, publish content, generate affiliate URLs/HopLinks, spend money, or apply migrations

## Contents

- `content/drafts/` — exactly 12 local article drafts, both indexes, G3 review, and `SHA256SUMS.json`
- `technical/developer-doc.md` — copied technical handoff; values remain runtime references
- `technical/frontend-adsense-handoff.md` — copied frontend/ads contract
- `technical/bigwriter-handoff.md` — copied editorial-runtime handoff
- `technical/schema-template-reference.sql` — copied FBR Blogs template reference only; not an applied migration
- `delivery-checklist.md` — executable checklist for database, frontend, backend, GitHub, Easypanel, domain, content, and smoke test

## Truth boundary

The name `blog_afterforty`, project UUID, `active` status, and domain are documented claims in Flux handoffs. No public readback proving the schema or project was found. `afterforty.fbr.news` did not resolve during the audit; the Control Tower host returned HTTP 401 without runtime authorization. Treat the schema as `DOCUMENTED_ONLY / NOT_EXTERNALLY_VERIFIED`

## Content boundary

G3 local review is present as `gabe-final-g3-review.md`: 5 PASS, 6 PASS_CONDITIONAL, 1 REFRAME, no publication authorization. All 12 drafts retain the official disclaimer and dated `Sources`; no actual affiliate URL or HopLink is included. The disclaimer's generic phrase about affiliate links is not itself an affiliate link

Do not mark the blog complete until remote readback and public smoke evidence exist
