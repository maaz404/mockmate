const axios = require("axios");

const LANGUAGE_ID = {
  javascript: 63,
  typescript: 74, // optional, may not be enabled on CE
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  csharp: 51,
};

function getJudge0Config() {
  const baseURL =
    process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
  const apiKey = process.env.RAPIDAPI_KEY || process.env.JUDGE0_API_KEY;
  const host = new URL(baseURL).host;
  return { baseURL, apiKey, host };
}

async function runSingle({ code, language, stdin = "" }) {
  const { baseURL, apiKey, host } = getJudge0Config();
  if (!apiKey) {
    const err = new Error(
      "Judge0 API not configured. Set RAPIDAPI_KEY in environment."
    );
    err.code = "JUDGE0_NOT_CONFIGURED";
    err.status = 501;
    throw err;
  }
  const language_id = LANGUAGE_ID[language];
  if (!language_id) {
    const e = new Error(`Unsupported language: ${language}`);
    e.code = "LANGUAGE_UNSUPPORTED";
    e.status = 400;
    throw e;
  }

  const url = `${baseURL}/submissions?base64_encoded=false&wait=true`;
  const headers = {
    "Content-Type": "application/json",
  };
  // RapidAPI headers if using RapidAPI host
  if (host.includes("rapidapi")) {
    headers["X-RapidAPI-Key"] = apiKey;
    headers["X-RapidAPI-Host"] = new URL(baseURL).host;
  }

  const payload = {
    source_code: code,
    language_id,
    stdin,
  };

  const resp = await axios.post(url, payload, { headers, timeout: 30000 });
  // Response contains stdout, stderr, compile_output, status
  const data = resp.data || {};
  return {
    stdout: data.stdout || "",
    stderr: data.stderr || "",
    compile_output: data.compile_output || "",
    status: data.status?.description || "",
    time: data.time || null,
    memory: data.memory || null,
  };
}

async function runWithTestCases({ code, language, testCases = [] }) {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    const single = await runSingle({ code, language });
    return { results: [{ input: "", ...single }] };
  }
  const results = [];
  for (const tc of testCases) {
    const input = typeof tc?.input === "string" ? tc.input : "";
    const expected =
      typeof tc?.expectedOutput === "string" ? tc.expectedOutput : undefined;
    // eslint-disable-next-line no-await-in-loop
    const r = await runSingle({ code, language, stdin: input });
    const output = (r.stdout || "").replace(/\r?\n$/, "");
    const expectedTrim = (expected || "").replace(/\r?\n$/, "");
    const pass =
      typeof expected !== "undefined" ? output === expectedTrim : undefined;
    results.push({
      input,
      expectedOutput: expected,
      output: r.stdout,
      stderr: r.stderr,
      compile_output: r.compile_output,
      status: r.status,
      time: r.time,
      memory: r.memory,
      pass,
    });
  }
  return { results };
}

module.exports = {
  runSingle,
  runWithTestCases,
};
