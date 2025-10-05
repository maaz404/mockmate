const { randomUUID } = require('crypto');

// Attaches a correlation / request ID to every request and response
// Header precedence order: X-Request-Id (incoming) > generated UUID
module.exports = function requestId(req, res, next) {
  const incoming = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  const id = (incoming && String(incoming).trim()) || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  // Provide lightweight logger helper on req for structured logs
  req.log = (level, msg, meta = {}) => {
    // eslint-disable-next-line no-console
    const base = { ts: new Date().toISOString(), level, msg, requestId: id, path: req.path, method: req.method };
    // Avoid huge meta objects in console in production by shallow copy
    const safeMeta = meta && Object.keys(meta).length ? { meta } : {};
    try {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ ...base, ...safeMeta }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(base, meta);
    }
  };
  return next();
};
