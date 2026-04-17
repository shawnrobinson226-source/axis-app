# V2-C Adapter Boundary

## Definition
An adapter is an external host layer that connects users to AXIS through official API contracts. It is not the kernel.

## Authority Boundary
- AXIS = source of truth.
- External hosts (including Sapphire or any other host) = adapter only.

## Allowed
- Call official AXIS API routes.
- Submit structured input into AXIS contracts.
- Render AXIS outputs.
- Orchestrate host-side user flow around AXIS calls.

## Forbidden
- Redefine taxonomy.
- Override continuity logic.
- Rewrite outcomes and present them as AXIS outputs.
- Silently mutate AXIS outputs while labeling them as AXIS truth.
- Bypass operator-scoped identity contract.
- Own or replace the AXIS kernel.

## Contract Enforcement
- Adapters must use `x-operator-id` on required routes.
- Adapters must treat AXIS response envelopes as authoritative outputs.
- Adapters may add host UX framing but may not alter kernel truth semantics.
