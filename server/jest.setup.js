/* eslint-disable no-console */
process.env.NODE_ENV = "test";
/* eslint-enable no-console */
process.env.MOCK_AUTH_FALLBACK = "true";
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
