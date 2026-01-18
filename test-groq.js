require("dotenv").config();

const apiKey = process.env.GROQ_API_KEY;
console.log("Checking API Key...");

if (!apiKey) {
  console.error("❌ ERROR: GROQ_API_KEY is missing from .env");
  process.exit(1);
}
console.log(
  "✅ API Key found (starts with: " + apiKey.substring(0, 5) + "...)"
);

async function testGroq() {
  console.log("Attempting to connect to Groq API...");
  const model = "llama-3.3-70b-versatile";

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content:
                "Hello! returning 'Connection Successful' if you hear me.",
            },
          ],
          model: model,
          temperature: 0.5,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API Request Failed!");
      console.error("Status:", response.status);
      console.error("Error Message:", data.error?.message);
      console.error("Model used:", model);
    } else {
      console.log("✅ Connection Successful!");
      console.log("AI Reply:", data.choices[0].message.content);
    }
  } catch (e) {
    console.error("❌ Network/Script Error:", e.message);
  }
}

testGroq();
