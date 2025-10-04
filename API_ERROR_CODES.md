## API Error Codes

This document catalogs standardized `error` codes returned by the backend JSON envelope:

Envelope structure:

```
// Success
{ "success": true, "data": <payload>, "message?": "optional message" }

// Error
{ "success": false, "error": "CODE", "message": "Human readable", "meta?": { ... } }
```

### Authentication & Authorization

| Code            | Meaning                  | Typical HTTP |
| --------------- | ------------------------ | ------------ |
| UNAUTHORIZED    | Missing / invalid auth   | 401          |
| INTERVIEW_LIMIT | Free plan quota exceeded | 403          |

### Profiles & Onboarding

| Code                        | Meaning                                             |
| --------------------------- | --------------------------------------------------- |
| PROFILE_NOT_FOUND           | User profile missing                                |
| PROFILE_NOT_ATTACHED        | Middleware failed to attach profile                 |
| PROFILE_EXISTS              | Duplicate profile creation attempted                |
| PROFILE_UPDATE_FAILED       | Generic update failure                              |
| ONBOARDING_SAVE_FAILED      | Failed to persist partial onboarding data           |
| ONBOARDING_COMPLETE_FAILED  | Failure finalizing onboarding                       |
| MISSING_DATA                | Both professional info & preferences missing        |
| MISSING_PROFESSIONAL_INFO   | Professional info missing while prefs present       |
| MISSING_PREFERENCES         | Preferences missing while professional info present |
| MISSING_PROFESSIONAL_FIELDS | Required fields (role/industry) absent              |
| NO_INTERVIEW_TYPE           | No interview types selected                         |
| VALIDATION_FAILED           | Mongoose or validation rule failure                 |

### Interviews

| Code                    | Meaning                                             |
| ----------------------- | --------------------------------------------------- |
| DB_NOT_CONNECTED        | Database not ready                                  |
| CONFIG_INVALID          | Required config fields missing                      |
| NO_QUESTIONS            | Unable to generate/find questions                   |
| INTERVIEW_CREATE_FAILED | Unexpected create failure                           |
| NOT_FOUND               | Interview resource not found                        |
| INVALID_STATE           | Action not valid for current interview state        |
| BAD_INDEX               | Question index invalid                              |
| START_FAILED            | Could not start interview                           |
| ANSWER_SUBMIT_FAILED    | Error recording answer                              |
| FOLLOWUP_GEN_FAILED     | AI follow-up generation failed (with meta.fallback) |
| FOLLOWUP_FAILED         | General follow-up retrieval error                   |
| COMPLETE_FAILED         | Error completing interview                          |
| INTERVIEWS_FETCH_FAILED | Listing query failed                                |
| INTERVIEW_FETCH_FAILED  | Details fetch failed                                |
| RESULTS_FETCH_FAILED    | Results fetch failed                                |
| FOLLOWUPS_REVIEW_FAILED | Marking follow-ups reviewed failed                  |
| DELETE_FAILED           | Interview deletion failed                           |

### Scheduling & Goals

| Code                   | Meaning                            |
| ---------------------- | ---------------------------------- |
| SCHEDULED_FETCH_FAILED | Failed listing scheduled sessions  |
| MISSING_FIELDS         | Required scheduling fields missing |
| SESSION_NOT_FOUND      | Scheduled session does not exist   |
| SESSION_SAVE_FAILED    | Create/update failed               |
| SESSION_DELETE_FAILED  | Delete failed                      |
| INVALID_STATUS         | Status not in allowlist            |
| SESSION_STATUS_FAILED  | Status update failed               |
| GOALS_FETCH_FAILED     | Failed loading goals               |
| INVALID_GOALS          | Non-array goals payload            |
| GOALS_UPDATE_FAILED    | Failure saving goals               |

### Media / Assets / Resume

| Code                 | Meaning                             |
| -------------------- | ----------------------------------- |
| INVALID_ASSET        | Malformed Cloudinary asset payload  |
| AVATAR_UPDATE_FAILED | Avatar asset update failed          |
| RESUME_UPDATE_FAILED | Resume asset metadata update failed |
| NO_FILE              | Multipart upload missing file       |
| RESUME_UPLOAD_FAILED | Physical file upload failed         |

### Tips / Dashboard

| Code                     | Meaning                        |
| ------------------------ | ------------------------------ |
| TIPS_FAILED              | Dynamic tips generation failed |
| DASHBOARD_SUMMARY_FAILED | Dashboard aggregation failed   |
| ANALYTICS_FETCH_FAILED   | Analytics retrieval failed     |

### Utility / Generic

| Code  | Meaning                                       |
| ----- | --------------------------------------------- |
| ERROR | Generic fallback when no specific code is set |

### Conventions

1. `error` is a stable machine code. UI should map `error -> localized message` instead of parsing `message`.
2. `message` remains human-readable (English) and can be shown directly for now.
3. `meta` contains structured context (e.g., `details`, `fallback`, or `detail`). Avoid relying on its shape for core UX flows.
4. Add new codes in this file when introducing new error branches.

### Frontend Handling Pattern

```js
try {
  const resp = await apiService.post("/interviews", payload);
  if (!resp.success) throw resp; // optional guard
} catch (err) {
  const code = err.code || err.error; // apiService normalization
  switch (code) {
    case "INTERVIEW_LIMIT":
      showUpgradeModal();
      break;
    case "NO_QUESTIONS":
      toast.error(
        "No questions matched that configuration. Try different filters."
      );
      break;
    default:
      toast.error(err.message || "Request failed");
  }
}
```

### Adding a New Code

1. Define `fail(res, status, 'NEW_CODE', 'Readable message')` in controller.
2. Update this file under the appropriate section.
3. (Optional) Extend frontend mapping.

---

Maintained as part of the backend standardization effort.
