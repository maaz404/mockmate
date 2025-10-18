# 🛡️ Input Validation Middleware - Usage Guide

## Overview

This guide explains how to use the new input validation middleware to secure API endpoints.

## Quick Start

### 1. Import the validators

```javascript
const {
  validateCreateInterview,
  validateInterviewId,
  validateSubmitAnswer,
} = require("../middleware/validators/interviewValidator");
```

### 2. Apply to routes

```javascript
router.post(
  "/",
  ensureAuthenticated,
  validateCreateInterview, // ← Add validation here
  createInterview
);
```

## Available Validators

### Interview Validators

#### `validateCreateInterview`

Validates interview creation payload.

**Required Fields:**

- `config.jobRole` - String, max 500 chars
- `config.interviewType` - One of: behavioral, technical, system-design, coding, mixed, general, case-study

**Optional Fields:**

- `config.experienceLevel` - One of: entry, junior, mid, senior, lead, executive
- `config.difficulty` - One of: easy, intermediate, hard, expert
- `config.duration` - Number, 5-180 minutes
- `config.questionCount` - Number, 1-50
- `config.skills` - Array of strings, max 100 chars each
- `questionIds` - Array of MongoDB ObjectIds

**Example:**

```javascript
router.post(
  "/interviews",
  ensureAuthenticated,
  validateCreateInterview,
  createInterview
);
```

#### `validateInterviewId`

Validates interview ID in URL parameter.

**Example:**

```javascript
router.get(
  "/interviews/:id",
  ensureAuthenticated,
  validateInterviewId,
  getInterviewDetails
);
```

#### `validateQuestionIndex`

Validates both interview ID and question index.

**Example:**

```javascript
router.post(
  "/interviews/:id/answer/:questionIndex",
  ensureAuthenticated,
  validateQuestionIndex,
  submitAnswer
);
```

#### `validateSubmitAnswer`

Validates answer submission payload.

**Fields:**

- `answer` - Optional string, max 10,000 chars
- `timeSpent` - Optional number, ≥ 0
- `videoData` - Optional object

**Example:**

```javascript
router.post(
  "/interviews/:id/answer/:questionIndex",
  ensureAuthenticated,
  validateSubmitAnswer,
  submitAnswer
);
```

#### `validateAdaptiveDifficulty`

Validates adaptive difficulty update.

**Required:**

- `difficulty` - One of: easy, intermediate, hard, expert

**Optional:**

- `reason` - String, max 500 chars

**Example:**

```javascript
router.put(
  "/interviews/:id/difficulty",
  ensureAuthenticated,
  validateAdaptiveDifficulty,
  updateAdaptiveDifficulty
);
```

## Error Response Format

When validation fails, the API returns:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "errors": [
    {
      "field": "config.jobRole",
      "message": "Job role is required",
      "value": ""
    }
  ],
  "requestId": "abc-123-def"
}
```

## Creating Custom Validators

### Step 1: Define validation rules

```javascript
const { body, param } = require("express-validator");

const validateYourEndpoint = [
  body("fieldName")
    .trim()
    .notEmpty()
    .withMessage("Field is required")
    .isLength({ max: 100 })
    .withMessage("Must be less than 100 characters"),

  handleValidationErrors, // Always add this
];
```

### Step 2: Export the validator

```javascript
module.exports = {
  validateYourEndpoint,
  // ... other validators
};
```

### Step 3: Use in routes

```javascript
router.post(
  "/your-endpoint",
  ensureAuthenticated,
  validateYourEndpoint,
  yourController
);
```

## Common Validation Rules

### String Validation

```javascript
body("field")
  .trim() // Remove whitespace
  .notEmpty()
  .withMessage("Required")
  .isLength({ min: 3, max: 100 })
  .withMessage("Length must be 3-100")
  .matches(/^[a-zA-Z0-9\s]+$/)
  .withMessage("Alphanumeric only");
```

### Number Validation

```javascript
body("field").isInt({ min: 0, max: 100 }).withMessage("Must be 0-100").toInt(); // Convert to integer
```

### Email Validation

```javascript
body("email").trim().isEmail().withMessage("Invalid email").normalizeEmail();
```

### MongoDB ObjectId

```javascript
param("id").isMongoId().withMessage("Invalid ID format");
```

### Array Validation

```javascript
body("items")
  .isArray()
  .withMessage("Must be an array")
  .notEmpty()
  .withMessage("Cannot be empty");

body("items.*").trim().notEmpty().withMessage("Items cannot be empty");
```

### Enum Validation

```javascript
body("status")
  .isIn(["pending", "active", "completed"])
  .withMessage("Invalid status");
```

### Custom Validation

```javascript
body("field").custom((value) => {
  if (value !== "expected") {
    throw new Error("Custom validation failed");
  }
  return true;
});
```

## Best Practices

### 1. Always validate user input

```javascript
// ❌ BAD: No validation
router.post("/api/data", controller);

// ✅ GOOD: With validation
router.post("/api/data", validateData, controller);
```

### 2. Sanitize strings

```javascript
body("text")
  .trim() // Remove whitespace
  .escape(); // Escape HTML entities
```

### 3. Set realistic limits

```javascript
// Prevent DoS attacks
body("description").isLength({ max: 10000 }); // Reasonable limit
```

### 4. Validate arrays

```javascript
// Prevent memory exhaustion
body("items").isArray({ max: 100 }); // Limit array size
```

### 5. Use constants

```javascript
const MAX_LENGTH = 500;

body("field")
  .isLength({ max: MAX_LENGTH })
  .withMessage(`Must be less than ${MAX_LENGTH} characters`);
```

## Testing Validation

### Manual Testing

```bash
# Valid request
curl -X POST http://localhost:5000/api/interviews \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "jobRole": "Software Engineer",
      "interviewType": "technical"
    }
  }'

# Invalid request (missing required field)
curl -X POST http://localhost:5000/api/interviews \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "jobRole": ""
    }
  }'
```

### Unit Testing

```javascript
const request = require("supertest");
const app = require("../server");

describe("POST /api/interviews", () => {
  it("should validate required fields", async () => {
    const res = await request(app)
      .post("/api/interviews")
      .send({
        config: {
          jobRole: "", // Invalid
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.errors).toHaveLength(1);
  });
});
```

## Security Considerations

### 1. Prevent Injection Attacks

✅ Validation prevents:

- SQL/NoSQL injection
- XSS attacks
- Command injection

### 2. Rate Limiting

Combine validation with rate limiting:

```javascript
router.post(
  "/api/sensitive",
  rateLimiter, // Limit requests
  validateInput, // Validate payload
  controller
);
```

### 3. Authentication First

Always authenticate before validating:

```javascript
router.post(
  "/api/data",
  ensureAuthenticated, // Auth first
  validateData, // Then validate
  controller
);
```

### 4. Sanitize Output

```javascript
// In controller
const sanitized = {
  name: user.name.trim(),
  email: user.email.toLowerCase(),
};
```

## Troubleshooting

### Validation passes but still errors

- Check if controller has additional validation
- Verify database schema constraints
- Check for async validation race conditions

### Validation fails unexpectedly

- Check if `trim()` is needed
- Verify data types match (string vs number)
- Check for trailing commas in arrays

### Custom validators not working

- Ensure `custom()` returns true or throws Error
- Check for async custom validators (use async/await)
- Verify error messages are strings

## Next Steps

1. ✅ Apply validation to all POST/PUT routes
2. ✅ Create validators for user and question endpoints
3. ✅ Add validation tests
4. ✅ Update API documentation

## References

- [express-validator docs](https://express-validator.github.io/docs/)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [MongoDB security best practices](https://docs.mongodb.com/manual/administration/security-checklist/)

---

**Created:** October 18, 2025  
**Status:** ✅ Ready for production use  
**Maintainer:** DevOps Team
