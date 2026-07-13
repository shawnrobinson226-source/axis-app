
## Reserved API Routes

- `/api/ai` is prohibited in AXIS under locked rule `API-R003`.
- AI behavior must use governed, purpose-specific endpoints.
- Do not recreate `/api/ai` as a generic AI passthrough.

## Terminology Change Rules

When changing user-facing language in TypeScript or TSX files:

- Do not replace bare words that may also appear inside identifiers.
- Separate UI copy changes from code identifier renames.
- Order replacement rules from most specific to least specific.
- Verify the diff before building.
- Use guarded or regex-scoped replacements when whitespace or line endings may vary.
- A successful build does not replace manual diff review.
