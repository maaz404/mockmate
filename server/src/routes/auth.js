/* eslint-disable consistent-return, no-magic-numbers */
const express = require("express");

const router = express.Router();

// This file is deprecated after migration to Google OAuth and local authentication.
// All authentication is now handled in:
// - src/auth/google.js (Google OAuth)
// - src/auth/localRoutes.js (local email/password)
// This file kept only for backwards compatibility and will be removed in a future update.

module.exports = router;
