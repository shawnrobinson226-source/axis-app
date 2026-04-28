# Operator Profile Change

## Files Changed

- `lib/operator/profile.ts`
- `app/api/v1/operator-profile/route.ts`
- `app/settings/operator-identity.tsx`
- `app/settings/page.tsx`
- `docs/OPERATOR_PROFILE_CHANGE.md`

## New Table Definition

The new additive persistence layer creates this table when operator profile data is accessed:

```sql
CREATE TABLE IF NOT EXISTS operator_profiles (
  operator_id TEXT PRIMARY KEY,
  display_name TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

No existing tables are modified.

## API Endpoints Added

- `GET /api/v1/operator-profile`
  - Requires `x-operator-id`
  - Returns `operator_id` and `display_name`
  - Does not fallback if identity is missing

- `POST /api/v1/operator-profile`
  - Requires `x-operator-id`
  - Accepts only `display_name`
  - Does not allow editing `operator_id`
  - Stores empty or default display names as `null`

The existing `GET /api/v2/operator-profile` route was not modified.

## UI Changes Made

- Settings now displays:
  - `Permanent ID` as a read-only operator identity value
  - `Display Name` as an editable user-facing label
- If no display name exists, the UI shows `Operator`.
- Settings includes the note: "This name is for display only. Your system identity does not change."

## Untouched Systems

- Engine logic was not changed.
- Distortion taxonomy was not changed.
- Outcomes were not changed.
- Existing API contracts were not changed.
- The V2 operator profile route was not changed.
- Session ownership was not changed.
- Continuity logic was not changed.
- Existing logs linkage was not changed.
- Existing table schemas were not changed.
- `x-operator-id` behavior was not changed.
