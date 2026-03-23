# VANTA — V1 Kernel

VANTA is a deterministic cognitive system for reducing distortion, restoring continuity, and executing aligned action.

This repository contains the locked **V1 Kernel**:
- 5-class distortion taxonomy
- deterministic session engine
- event ledger architecture
- derived analytics layer
- Next.js interface (Session, Dashboard, Logs, Settings)

---

## ⚙️ Core Concept

VANTA converts a raw internal trigger into a structured decision outcome:

Trigger → Classification → Protocol → Action → Logged Event → Continuity Update

No guessing. No abstraction drift. Fully deterministic.

---

## 🧠 System Architecture

### 1. Session Engine (`/session`)
Input → structured session → processed by engine → stored in DB

### 2. Engine (`lib/engine/executionFlow.ts`)
Pure deterministic logic:
- distortion classification handling
- severity calculation
- continuity delta computation

### 3. Database (Turso / SQLite)

Tables:
- `entries` → session logs
- `state_checks` → baseline state
- `events` → immutable event ledger
- `derived_*` → rebuildable analytics

### 4. Dashboard (`/dashboard`)
Read-only system state:
- continuity score
- active fractures
- volatility band
- alignment vectors

### 5. Logs (`/logs`)
Audit trail of sessions.

---

## 🧩 Distortion Taxonomy (V1 Locked)

- narrative
- emotional
- behavioral
- perceptual
- continuity

---

## 🚀 Getting Started

### 1. Clone

```bash
git clone https://github.com/shawnrobinson226-source/vanta-app.git
cd vanta-app