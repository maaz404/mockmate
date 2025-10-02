const axios = require("axios");

(async () => {
  try {
    const res = await axios.post("http://localhost:5000/api/chatbot/chat", {
      messages: [{ role: "user", content: "Hello from test script" }],
      context: { currentPage: "/dashboard" },
    });
    console.log("OK:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("ERROR:", err.response.status, err.response.data);
    } else {
      console.error("ERROR:", err.message);
    }
  }
})();
