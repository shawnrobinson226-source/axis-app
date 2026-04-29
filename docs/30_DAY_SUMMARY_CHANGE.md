# 30-Day Summary Change

## Files Added

- `lib/summary/monthly.ts`
- `app/api/v1/summary/30-day/route.ts`
- `docs/30_DAY_SUMMARY_CHANGE.md`

## Files Updated

- `app/dashboard/page.tsx`

## Functions Added

- `get30DaySummary(operator_id)` in `lib/summary/monthly.ts`

The function reads existing `sessions` rows for the operator from the last 30 days and aggregates only persisted fields:

- `distortion_class`
- `next_action`
- `outcome`
- `continuity_score_after`
- `created_at`

## Endpoint Added

- `GET /api/v1/summary/30-day`

Rules:

- Requires `x-operator-id`
- Fails if identity is missing
- Returns the 30-day summary object
- Returns the empty-safe structure when no sessions exist in the last 30 days
- No V2 endpoint was added

## UI Updates

Dashboard now includes a `30-Day Execution Summary` section showing:

- total sessions
- most common distortion
- outcome counts
- continuity delta
- most repeated pattern
- most common action

If no activity exists in the last 30 days, the dashboard displays:

`No activity in the last 30 days.`

## Exact Empty Response Behavior

```json
{
  "total_sessions": 0,
  "distortion_frequency": {
    "narrative": 0,
    "emotional": 0,
    "behavioral": 0,
    "perceptual": 0,
    "continuity": 0
  },
  "outcome_distribution": {
    "reduced": 0,
    "unresolved": 0,
    "escalated": 0
  },
  "most_common_distortion": null,
  "continuity_change": {
    "start": null,
    "end": null,
    "delta": null
  },
  "most_repeated_pattern": null,
  "most_common_action": null
}
```

## Untouched Systems

- Engine logic was not changed.
- Distortion taxonomy was not changed.
- Outcomes were not changed.
- Continuity logic was not changed.
- Session write schema was not changed.
- V2 endpoints were not changed.
- Operator identity behavior was not changed.
- No AI inference, scoring system, prediction, NLP, sentiment analysis, or session write behavior was added.

## Verification Results

- `npm run lint` passed
- `npx tsc --noEmit` passed
- `npm run build` passed
