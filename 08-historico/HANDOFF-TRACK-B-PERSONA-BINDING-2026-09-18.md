# Handoff — Track B Persona Binding Local Slice

## Implemented

- Versioned `AuthorityPersonaBindingInput` validates contract version, explicit approval, approved version membership, snapshot hash, event ID and idempotency key.
- `BlogService.bindApprovedPersona()` creates the local blog, persists `blog_persona_bindings` and inherited editorial configuration, records `blog.persona_bound`, and returns a metadata-only receipt.
- Same idempotency key/event returns the original sanitized receipt without reprovisioning.
- JSON repository persists bindings and editorial configs across process instances.
- Authenticated service boundary: `POST /api/integrations/flux/blog-provisioning` requires `Authorization: Bearer <FBR_BLOGS_SERVICE_TOKEN>`.
- SQL is a review-only local contract addition; no migration was executed.

## Pending / blocked

- Supabase repository adapter still needs production persistence methods and a gated migration.
- Signature verification/service identity should be aligned with the final signed service-to-service Flux contract; the local v1 contract is documented in `03-arquitetura/authority-blogs-flux-adapter-contract-v1.md` and the current boundary uses a configured bearer token.
- Full blog lifecycle, versioned names/domains, DNS/readbacks, outbox/inbox delivery, Control Tower reconciliation and publication gates remain pending.
- No remote calls, migrations, deployment, DNS, publication or secret values were used.
