// Unified response helpers
// Success: ok(res, data, message?) -> { success: true, data, message? }
// Error: fail(res, status, code, message, meta?) -> { success: false, error: code, message, ...(meta&&{meta}) }

function ok(res, data = null, message = undefined) {
  const body = { success: true };
  if (data !== null) body.data = data;
  if (message) body.message = message;
  return res.status(200).json(body);
}

function created(res, data = null, message = "Created") {
  // eslint-disable-line no-magic-numbers
  const body = { success: true };
  if (data !== null) body.data = data;
  if (message) body.message = message;
  return res.status(201).json(body); // eslint-disable-line no-magic-numbers
}

function fail(
  res,
  status = 400,
  code = "ERROR",
  message = "Request failed",
  meta
) {
  const body = { success: false, error: code, message };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

module.exports = { ok, created, fail };
