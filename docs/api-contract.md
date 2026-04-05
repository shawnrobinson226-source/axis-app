# VANTA API Contract

Status: V1  
Version: v1  
Scope: Read-only external access layer for VANTA runtime state

---

## Purpose

The VANTA API exposes a stable, read-only interface over the locked V1 system.

It exists to let external consumers inspect runtime state without redefining, bypassing, or mutating VANTA core logic.

This API is a transport layer only.

VANTA remains the source of truth for:
- taxonomy
- scoring
- session engine
- continuity logic
- data contracts
- output meaning

External systems may consume VANTA outputs.

External systems may not redefine VANTA.

---

## Base Path

```text
/api/v1