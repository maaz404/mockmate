# Supported Job Roles & Aliases

This document lists the canonical `jobRole` keys available in `questionTemplates.json` and the accepted aliases that will be normalized automatically by the `HybridQuestionService`.

## Canonical Role Keys

```
software-engineer
frontend-developer
backend-developer
full-stack-developer
mobile-developer
cloud-architect
site-reliability-engineer
software-tester
qa-engineer
data-analyst
data-engineer
system-administrator
it-support-specialist
cybersecurity-analyst
product-manager
scrum-master
ui-ux-designer
machine-learning-engineer
network-engineer
```

## Normalized Aliases

The following inputs will map to the canonical roles above:

| Alias Input                                               | Canonical Role            |
| --------------------------------------------------------- | ------------------------- |
| `tester`, `software tester`, `qa tester`                  | software-tester           |
| `qa`, `quality assurance`                                 | qa-engineer               |
| `sre`, `site reliability`, `site reliability engineer`    | site-reliability-engineer |
| `full stack`, `fullstack`                                 | full-stack-developer      |
| `mobile`, `ios`, `android`                                | mobile-developer          |
| `cloud`, `cloud engineer`                                 | cloud-architect           |
| `data scientist`, `data analysis`                         | data-analyst              |
| `data engineering`                                        | data-engineer             |
| `system admin`, `sysadmin`                                | system-administrator      |
| `it support`, `helpdesk`                                  | it-support-specialist     |
| `cyber security`, `security analyst`, `security engineer` | cybersecurity-analyst     |
| `product manager`, `product owner`                        | product-manager           |
| `scrum master`, `agile coach`                             | scrum-master              |
| `ui designer`, `ux designer`, `ui ux designer`            | ui-ux-designer            |
| `machine learning engineer`, `ml engineer`                | machine-learning-engineer |
| `network engineer`, `networking`                          | network-engineer          |

## Unknown Role Fallback

If an unrecognized role is provided, a heuristic classifier attempts to map it to the closest existing template cluster using keywords (e.g., roles containing `aws` -> `cloud-architect`, `routing` -> `network-engineer`). If no heuristic matches, the fallback is `software-engineer`.

## Adding New Roles

1. Add a new top-level key under `server/src/data/questionTemplates.json` following existing structure.
2. Provide `beginner`, `intermediate`, and `advanced` blocks with `technical` and `behavioral` arrays (and optional `system-design`).
3. Update `normalizeRole` alias map for common synonyms.
4. Optionally extend keyword heuristics in `classifyUnknownRole` for better automatic clustering.
5. Run `node src/scripts/validateTemplates.js` to verify coverage.
6. Add/update tests in `src/__tests__/templateValidation.test.js` if stricter rules are needed.

## Validation Script

Run:

```
cd server
node src/scripts/validateTemplates.js
```

Non-zero exit code indicates missing minimum coverage.

---

Last updated: (auto-generated) New aliases and heuristic classification added.
