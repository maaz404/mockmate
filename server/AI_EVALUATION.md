# AI Evaluation & Advanced Feedback

This file explains how the AI-backed evaluation and advanced feedback work in the server,
and lists environment variables and feature flags required to enable them.

## Feature Flags

- `server/src/config/features.js`
  - `AI_QUESTIONS` (enable per-question AI evaluation)
  - `ADVANCED_ANALYTICS` (enable aggregated analytics & soft-skills analysis)

Set both to `true` to use AI providers for evaluation and advanced feedback.

## Required Environment Variables

- `GEMINI_API_KEY` — API key for Gemini (GeminiService)
- `GROK_API_KEY` — API key for Grok (GrokService)
- (Optional) other provider keys if you map different providers in `server/src/config/aiProviders.js`

Example (PowerShell):

```powershell
$env:GEMINI_API_KEY = "sk-..."
$env:GROK_API_KEY = "sk-..."
```

## How it works

- When an answer is submitted, `interviewController` calls `evaluationService.evaluateAnswerWithAI(...)`.
- `evaluationService` routes evaluation to the centralized `aiProviders` manager which picks the configured provider (Gemini/Groq/Grok).
- Provider returns structured JSON (score, rubricScores, strengths, improvements, feedback). The service normalizes this response and saves it alongside the question.
- After interview completion, `advancedFeedbackService.generateAdvancedFeedback` aggregates responses and requests soft-skills analysis and a coaching tip from AI providers and attaches `analysis.advancedFeedback` to results returned to the frontend.

## Notes & Best Practices

- If API keys are missing the system falls back to a lightweight keyword-based evaluator to avoid blocking user flows.
- AI calls may add latency — consider running them asynchronously and updating interview documents when ready.
- Watch provider rate limits configured in `server/src/config/aiProviders.js`.
