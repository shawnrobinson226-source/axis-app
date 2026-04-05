# VANTA V1 — Freeze Declaration

STATUS: FROZEN
DATE: 2026-04-04

## Locked System

- executionFlow.ts is authoritative engine
- schema.sql is single source of truth
- Kernel: fractures, matcher, reframe, redirect, analyze
- Routes: / /session /dashboard /logs /settings
- Flow: Trigger → Classification → Protocol → Action → Log → Continuity

## Confirmed Working

- Session pipeline end-to-end
- Deterministic outputs stable
- Logs persist
- Dashboard reflects data
- No runtime failures

## Removed / Archived

- events_ledger.sql (unused)
- 2026-03-31-v1-enforcement.sql (legacy entries table)

## Ownership Boundary

VANTA (SOURCE OF TRUTH):
- taxonomy
- scoring
- engine logic
- continuity
- data contracts

SAPPHIRE (ADAPTER ONLY):
- execution surface
- plugins
- external invocation

## Extension Rules

Allowed:
- additive schema fields
- new API routes

Not allowed:
- taxonomy changes
- engine logic changes
- flow changes

V1 is locked.
