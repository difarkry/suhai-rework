const express = require("express");
const path = require("path");
require("dotenv").config(); // Load env vars

// Backend Modules (Separation of Concerns)
const connectDB = require("./backend/config/db");
const WeatherLog = require("./backend/models/WeatherLog");
// Note: Chat model is used implicitly in aiService, but if needed here we can import it
const { processChat } = require("./backend/services/aiService");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Middleware
app.use(express.json());

// Dynamic Config Endpoint (MUST be before static to avoid shadowing)
app.get("/js/config.js", (req, res) => {
  res.type("application/javascript");
  res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
  res.send(`
    const CONFIG = {
      WEATHER_API_KEY: "${process.env.WEATHER_API_KEY}",
      OPEN_METEO_URL: "${process.env.OPEN_METEO_URL || "https://api.open-meteo.com/v1/forecast"}",
    };
    export default CONFIG;
  `);
});

// Serve Static Files
app.use(express.static(path.join(__dirname, "public")));

// Serve Page Routes
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html")),
);
app.get("/forecast.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "forecast.html")),
);
app.get("/heatmap.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "heatmap.html")),
);
app.get("/ai.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "ai.html")),
);

// --- SECURITY: Rate Limiter (Anti-Spam) ---
const rateLimit = new Map();
const LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 15; // Max 15 messages per minute

setInterval(
  () => {
    const now = Date.now();
    for (const [ip, data] of rateLimit.entries()) {
      if (now - data.startTime > LIMIT_WINDOW) {
        rateLimit.delete(ip);
      }
    }
  },
  5 * 60 * 1000,
);

// API: AI Chat (Refactored to Controller/Service pattern)
app.post("/api/chat", async (req, res) => {
  try {
    // 1. Rate Check
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, { count: 1, startTime: now });
    } else {
      const data = rateLimit.get(ip);
      if (now - data.startTime < LIMIT_WINDOW) {
        if (data.count >= MAX_REQUESTS) {
          console.warn(`🛑 Spam blocked from IP: ${ip}`);
          return res.status(429).json({
            error:
              "Too Many Requests. Santai dulu kak, jangan spam ya! 🛑 (Tunggu 1 menit)",
          });
        }
        data.count++;
      } else {
        rateLimit.set(ip, { count: 1, startTime: now });
      }
    }

    let { message, context, sessionId } = req.body;

    // Validation
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message format" });
    }
    if (message.length > 500) {
      message = message.substring(0, 500); // Truncate
    }
    message = message.trim();

    // Call Process Service
    const aiReply = await processChat(message, context, sessionId);

    res.json({ reply: aiReply });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({
      reply: "Maaf, otak saya sedang beku (Server Error). Coba lagi nanti! 🥶",
    });
  }
});

// API: Log Weather Data (For ML Training)
app.post("/api/log-weather", async (req, res) => {
  try {
    const data = req.body;

    // Basic validation
    if (!data.location || data.temperature === undefined) {
      return res.status(400).json({ error: "Invalid data" });
    }

    // Check for duplicate data (Debounce)
    const lastLog = await WeatherLog.findOne({
      location: { $regex: new RegExp("^" + data.location + "$", "i") },
    }).sort({ timestamp: -1 });

    if (lastLog) {
      const isSame =
        lastLog.temperature === data.temperature &&
        lastLog.humidity === data.humidity &&
        lastLog.windSpeed === data.windSpeed &&
        lastLog.conditionCodes === data.condition &&
        lastLog.isDay === data.isDay;

      if (isSame) {
        return res.json({ success: true, skipped: true });
      }
    }

    const newLog = new WeatherLog({
      location: data.location,
      temperature: data.temperature,
      humidity: data.humidity,
      windSpeed: data.windSpeed,
      pressure: data.pressure,
      conditionCodes: data.condition,
      isDay: data.isDay,
    });

    await newLog.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Log Error:", error);
    res.status(500).json({ error: "Failed to log data" });
  }
});

// API: Get Weather History (For ML Training)
app.get("/api/weather-history", async (req, res) => {
  try {
    const { location } = req.query;
    const filter = location ? { location: new RegExp(location, "i") } : {};

    const history = await WeatherLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(500);

    res.json(history);
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// API: Get Real Heatmap Data
app.get("/api/heatmap-data", async (req, res) => {
  try {
    const data = await WeatherLog.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$location",
          lat: { $first: "$lat" },
          lon: { $first: "$lon" },
          temp: { $first: "$temperature" },
          location: { $first: "$location" },
        },
      },
      { $match: { lat: { $exists: true }, lon: { $exists: true } } },
    ]);

    res.json(data);
  } catch (e) {
    console.error("Heatmap fetch error:", e);
    res.status(500).json({ error: "Failed to fetch heatmap data" });
  }
});

// DEBUG: Test DB Connection & Write on Startup (Only if DB is empty)
const mongoose = require("mongoose"); // Needed for connection check
mongoose.connection.once("open", async () => {
  try {
    const count = await WeatherLog.countDocuments();
    if (count === 0) {
      console.log("Creating initial test log...");
      await new WeatherLog({
        location: "TEST_ENTRY",
        temperature: 25,
        humidity: 50,
        windSpeed: 10,
        conditionCodes: "Test",
        isDay: true,
      }).save();
      console.log("✅ Test Log created! Collection should be visible now.");
    }
  } catch (e) {
    console.error("❌ DB Write Test Failed:", e);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Weathera Server running on http://localhost:${PORT}`);
});
