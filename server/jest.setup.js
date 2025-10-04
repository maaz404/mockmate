/* eslint-disable no-console */
process.env.NODE_ENV = "test";
/* eslint-enable no-console */
process.env.MOCK_AUTH_FALLBACK = "true";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
// Extend default jest timeout for slower integration (DB spin-up, AI fallbacks)
const ONE_SECOND_MS = 1000; // lint: descriptive constant
const THIRTY_SECONDS = 30; // lint: descriptive constant
const JEST_GLOBAL_TIMEOUT_MS = THIRTY_SECONDS * ONE_SECOND_MS; // 30s
jest.setTimeout(JEST_GLOBAL_TIMEOUT_MS);
// Silence noisy logs during tests
const silenced = ["info", "warn", "error"];
// eslint-disable-next-line no-console
silenced.forEach((level) => {
  // eslint-disable-next-line no-console
  if (!console[level]) return;
  // eslint-disable-next-line no-console
  const orig = console[level];
  // eslint-disable-next-line no-console
  console[level] = (...args) => {
    if (process.env.DEBUG_TEST_LOGS) orig(...args);
  };
});
