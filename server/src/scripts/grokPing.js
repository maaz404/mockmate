const axios = require("axios");
require("dotenv").config({ path: __dirname + "/../../.env" });

(async () => {
  const apiKey = process.env.GROK_API_KEY;
  const apiUrl =
    process.env.GROK_API_URL || "https://api.x.ai/v1/chat/completions";
  const model = process.env.GROK_MODEL || "grok-beta";

  if (!apiKey) {
    console.error("No GROK_API_KEY found in .env");
    process.exit(1);
  }

  try {
    const res = await axios.post(
      apiUrl,
      {
        model,
        messages: [
          { role: "system", content: "You are a health check bot." },
          { role: "user", content: "ping" },
        ],
        temperature: 0,
        max_tokens: 1,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    console.log("Grok OK:", {
      status: res.status,
      model: res.data?.model,
      choicesLen: Array.isArray(res.data?.choices)
        ? res.data.choices.length
        : 0,
    });
  } catch (err) {
    if (err.response) {
      console.error("Grok ERROR:", err.response.status, err.response.data);
    } else {
      console.error("Grok ERROR:", err.message);
    }
    process.exit(1);
  }
})();
