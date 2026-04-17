# V2-C Interface Contract

## Purpose
Define the external callable interface for AXIS / Continuity Engine while preserving AXIS as the source of truth.

## Source-of-Truth Rule
- AXIS owns classification, continuity, state transitions, and outcome generation.
- External callers may invoke AXIS routes and render returned outputs.
- External callers may not replace AXIS classification, continuity logic, or outcomes with caller-defined truth.

## Official Routes

### `POST /api/v2/execute`
- Required identity header: `x-operator-id` (non-empty).
- Request shape:
  - `trigger` (required string)
  - `distortion_class` (required string; validated against locked set)
  - `next_action` (required string)
  - Optional fields: `origin`, `thought`, `emotion`, `behavior`, `protocol`, `clarity_rating`, `outcome`, `stability`, `reference`, `impact`
- Validation:
  - Required string fields must be non-empty.
  - Numeric fields must be finite.
  - Locked enum fields are validated by AXIS.
- Response shape (success):
  - Standard envelope: `{ ok: true, version, data }`
  - `data` contains AXIS-generated execution result.
- Error shape:
  - Standard envelope: `{ ok: false, version, error }`
  - `401` for missing identity, `400` for invalid input, `429` for rate limit, `405` for invalid methods.
- Allowed:
  - Execute a session through AXIS processing.
- Not allowed:
  - Caller override of AXIS truth logic.

### `GET /api/v2/analytics`
- Required identity header: `x-operator-id` (non-empty).
- Request shape:
  - No body.
- Response shape (success):
  - Standard envelope: `{ ok: true, version, data }`
  - `data` includes continuity state, active fracture count, recent session list, and volatility band.
- Error shape:
  - Standard envelope: `{ ok: false, version, error }`
  - `401` for missing identity, `429` for rate limit, `405` for invalid methods.
- Allowed:
  - Read operator-scoped AXIS analytics outputs.
- Not allowed:
  - Caller mutation of analytics truth.

### `GET /api/v2/operator-profile`
- Required identity header: `x-operator-id` (non-empty).
- Request shape:
  - No body.
- Response shape (success):
  - Standard envelope: `{ ok: true, version, data }`
  - `data` includes operator continuity snapshot and activity summary derived from AXIS state.
- Error shape:
  - Standard envelope: `{ ok: false, version, error }`
  - `401` for missing identity, `429` for rate limit, `405` for invalid methods.
- Allowed:
  - Read operator-scoped profile summary derived from AXIS outputs.
- Not allowed:
  - Caller-authored profile truth presented as AXIS output.

## Standard Contract Rules
- All V2 routes require `x-operator-id`.
- All inputs are validated before processing.
- All outputs use a consistent envelope (`ok`, `version`, `data|error`).
- No hidden fallback identity.
- No direct mutation outside official endpoints.
- No caller can redefine classification, continuity, or outcomes.

## External Caller Limits
- External systems may invoke AXIS and render AXIS outputs.
- External systems may not redefine AXIS truth or silently replace AXIS-generated decisions.
