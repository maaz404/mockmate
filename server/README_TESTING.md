# Testing Overview

This document summarizes the initial integration and utility tests added during the refactor standardization phase.

## Added Tests

1. `src/__tests__/api.integration.test.js`
   - Verifies health endpoint responds OK.
   - Ensures a user profile is returned (auto-created in mock auth mode).
   - Creates an interview, starts it, submits an answer.
2. `src/__tests__/subscription.util.test.js`
   - Validates idempotent consumption of free-plan interview quota.
   - Ensures remaining quota cannot go negative.

## Running Tests

```bash
npm test
```

Set `DEBUG_TEST_LOGS=1` to see console output during tests:

```bash
DEBUG_TEST_LOGS=1 npm test
```

## Mock Auth Mode

Tests rely on `MOCK_AUTH_FALLBACK=true` so routes that require authentication receive a stub user id `test-user-123`.

## Next Test Targets

- Interview adaptive question flow (`/adaptive-question`).
- Completion and results analysis (`/interviews/:id/complete` + `/results`).
- Goals and scheduled sessions CRUD edge cases.
- Error cases (invalid config, exceeding quotas, bad indices).

## Notes

These tests are intentionally lightweight smoke checks to validate the refactor didn't break core flows. Expand with more granular unit tests for AI services and question generation fallbacks as needed.
