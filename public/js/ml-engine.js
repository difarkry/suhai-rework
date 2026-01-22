import { WeatherData } from "./suhAI-data.js";

export const MLEngine = {
  isReady: false,
  model: null, // No longer used, but kept for compatibility if referenced
  slope: 0,
  intercept: 0,

  async init() {
    console.log("🧠 Weathera Lite Engine Initializing...");
    // No await tf.ready() needed!
    this.isReady = true;
    console.log("🧠 Lite Engine Ready (No Lag)!");

    // Determine which features to run based on available data
    this.setupListeners();
    this.trainTrendModel(WeatherData.current?.location || "Jepara");
    this.predictComfort();
    this.recommendActivities();
  },

  setupListeners() {
    window.addEventListener("weather-updated", (e) => {
      const { city, data } = e.detail;
      console.log(`🧠 ML: Context switched to ${city}. Recalculating...`);

      // Extracts FRESH data directly from event (Avoids race condition with suhAI-app.js)
      const freshCurrent = {
        location: data.location.name,
        temperature: Math.round(data.current.temp_c),
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
      };

      // Re-run all modules with new data
      this.trainTrendModel(city);
      this.predictComfort(freshCurrent);
      this.recommendActivities(freshCurrent);
      this.predictDisasterRisk(); // Recalculate disaster risk
    });
  },

  async trainTrendModel(city = "Jepara") {
    // ... (unchanged)
  },

  // ... (predictNext24Hours unchanged)

  predictComfort(dataOverride = null) {
    const current = dataOverride || WeatherData.current;
    if (!current) return;

    const T = Number(current.temperature);
    // ... (rest unchanged)
  },

  recommendActivities(dataOverride = null) {
    const current = dataOverride || WeatherData.current;
    if (!current) return;
    // ... (rest unchanged)
  },

  async trainTrendModel(city = "Jepara") {
    console.log(`🧠 ML: Loading History for ${city}...`);
    // 1. Fetch Data
    let history = [];
    try {
      history = await fetch(`/api/weather-history?location=${city}`).then((r) =>
        r.json(),
      );
    } catch (e) {
      console.warn("ML: Failed to fetch DB history", e);
    }

    if (history.length < 5) {
      console.log(
        `🧠 ML: Not enough history for ${city} (${history.length}). Skipping trend.`,
      );
      return;
    }

    // Prepare Data: [Hour, Temp]
    const dataPoints = history.map((h) => {
      const date = new Date(h.timestamp);
      // Normalize hour 0-24 to 0-1 range for stability, though generic regression works fine nicely on 0-24 too
      // Let's use raw hours for easier math visualization: 0 to 23
      return { x: date.getHours(), y: h.temperature };
    });

    // 2. Perform Linear Regression (Least Squares)
    // Formula: y = mx + b
    // m (slope) = (N * Σ(xy) - Σx * Σy) / (N * Σ(x^2) - (Σx)^2)
    // b (intercept) = (Σy - m * Σx) / N

    const N = dataPoints.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;

    for (const p of dataPoints) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    }

    const slope = (N * sumXY - sumX * sumY) / (N * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / N;

    this.slope = slope;
    this.intercept = intercept;

    console.log(
      `🧠 ML: Regression Calculated. Slope: ${slope.toFixed(4)}, Intercept: ${intercept.toFixed(2)}`,
    );

    // Predict Next 24 Hours
    this.predictNext24Hours();
  },

  async predictNext24Hours() {
    const next24 = [];
    const nowHour = new Date().getHours();

    for (let i = 0; i < 24; i++) {
      const h = (nowHour + i) % 24;

      let predTemp = this.slope * h + this.intercept;

      // Sanity clamp (don't go below 10 or above 50 due to math weirdness)
      predTemp = Math.max(15, Math.min(45, predTemp));

      next24.push({ hour: h, temp: parseFloat(predTemp.toFixed(1)) });
    }

    console.log("🧠 ML Prediction (Lite):", next24);

    // Determine Trend
    // Simple logic: Is the end higher than the start?
    const trend = next24[12].temp > next24[0].temp ? "Naik 📈" : "Turun 📉";

    // Dispatch Event to UI
    window.dispatchEvent(
      new CustomEvent("ml-prediction-ready", {
        detail: { forecast: next24, trend: trend },
      }),
    );
  },

  predictComfort(dataOverride = null) {
    const current = dataOverride || WeatherData.current;
    if (!current) return;

    const T = Number(current.temperature);
    const H = Number(current.humidity);

    let text = "Nyaman";
    let icon = "😊";
    let color = "text-green-400";

    // Logic
    if (T > 30) {
      if (H > 60) {
        text = "Lengket & Panas";
        icon = "🥵";
        color = "text-red-500";
      } else {
        text = "Panas Kering";
        icon = "🔥";
        color = "text-orange-500";
      }
    } else if (T < 24) {
      if (H > 80) {
        text = "Dingin Lembab"; // e.g., 8C, high humidity
        icon = "🥶";
        color = "text-blue-400";
      } else {
        text = "Sejuk";
        icon = "🍃";
        color = "text-cyan-400";
      }
    } else {
      // 24 - 30
      if (H > 75) {
        text = "Agak Gerah";
        icon = "😓";
        color = "text-yellow-400";
      }
    }

    window.dispatchEvent(
      new CustomEvent("ml-comfort-updated", {
        detail: { text, icon, color },
      }),
    );
  },

  recommendActivities(dataOverride = null) {
    const current = dataOverride || WeatherData.current;
    if (!current) return;

    const activities = [
      {
        name: "Lari Pagi/Sore",
        goodCond: ["Cerah", "Berawan", "Cloudy", "Clear", "Sun"],
        minT: 20,
        maxT: 30,
        maxRain: 0,
      },
      {
        name: "Mancing",
        goodCond: ["Berawan", "Mendung", "Cloudy", "Overcast"],
        minT: 22,
        maxT: 32,
        maxRain: 20,
      },
      {
        name: "Ngopi Indoor",
        goodCond: ["Hujan", "Gerimis", "Badai", "Rain", "Drizzle", "Storm"],
        minT: 0,
        maxT: 40,
        maxRain: 100,
      },
      {
        name: "Jemur Pakaian",
        goodCond: ["Cerah", "Sun", "Clear"],
        minT: 25,
        maxT: 40,
        maxRain: 0,
      },
      {
        name: "Tidur Siang",
        goodCond: ["Hujan", "Rain", "Thunderstorm"],
        minT: 20,
        maxT: 28,
        maxRain: 100,
      },
    ];

    const T = Number(current.temperature);

    // Calculate Score (0-100%)
    const recs = activities
      .map((act) => {
        let score = 50; // Base score

        // 1. Condition Match
        const isCondMatch = act.goodCond.some((c) =>
          current.condition.toLowerCase().includes(c.toLowerCase()),
        );
        if (isCondMatch)
          score += 30; // Boost
        else score -= 20;

        // 2. Temp Match
        if (T >= act.minT && T <= act.maxT) score += 20;
        else score -= 20;

        // 3. Rain Check
        const isRaining =
          current.condition.toLowerCase().includes("hujan") ||
          current.condition.toLowerCase().includes("rain") ||
          current.condition.toLowerCase().includes("thun") ||
          current.condition.toLowerCase().includes("gerimis");

        if (isRaining && act.maxRain === 0) {
          score = 10; // Almost impossible to run/dry clothes if raining
        }

        // Clamp 0-100
        score = Math.max(0, Math.min(100, score));

        return { ...act, score };
      })
      .sort((a, b) => b.score - a.score); // Best first? Or keep fixed order? User photo implies fixed order?
    // User photo list: Lari, Mancing, Ngopi, Jemur, Tidur.
    // It seems sorted by percentage in the photo (70, 50, 30, 20, 0).
    // So sorting by score is correct.

    window.dispatchEvent(
      new CustomEvent("ml-activities-updated", {
        detail: { activities: recs },
      }),
    );

    // Also trigger disaster check
    this.predictDisasterRisk();
  },

  predictDisasterRisk() {
    // Analyze 7-Day Forecast for Risks
    // We need forecast data.
    const forecast = WeatherData.forecast || [];
    if (forecast.length === 0) return;

    let highestRisk = 0;
    let disasterType = "Aman";
    let message = "Tidak ada potensi bencana signifikan.";
    let details = [];

    // Counters
    let rainDays = 0;
    let stormDays = 0;
    let extremeHeatDays = 0; // > 35C

    forecast.forEach((day) => {
      const cond = day.condition.toLowerCase();
      if (cond.includes("rain") || cond.includes("hujan")) rainDays++;
      if (
        cond.includes("storm") ||
        cond.includes("badai") ||
        cond.includes("petir")
      )
        stormDays++;
      if (day.high > 35) extremeHeatDays++;
    });

    // 1. Flood Risk (Banjir)
    // If > 4 days of rain or heavy rain consecutive (simplified)
    if (rainDays >= 4) {
      let risk = rainDays * 15; // 4 days = 60%, 7 days = 105%
      if (risk > highestRisk) {
        highestRisk = Math.min(100, risk);
        disasterType = "Potensi Banjir";
        message = "Curah hujan tinggi diprediksi dalam seminggu kedepan.";
      }
    }

    // 2. Heatwave Risk (Gelombang Panas)
    if (extremeHeatDays >= 3) {
      let risk = extremeHeatDays * 25;
      if (risk > highestRisk) {
        highestRisk = Math.min(100, risk);
        disasterType = "Gelombang Panas";
        message = "Suhu ekstrem > 35°C diprediksi selama beberapa hari.";
      }
    }

    // 3. Storm Risk (Badai)
    if (stormDays >= 1) {
      let risk = stormDays * 40; // 1 day = 40, 2 = 80
      if (risk > highestRisk) {
        highestRisk = Math.min(100, risk);
        disasterType = "Badai Petir";
        message = "Aktivitas badai terdeteksi dalam ramalan cuaca.";
      }
    }

    // Hard override for demo purposes if needed? No, let's trust logic.
    // Ensure we trigger > 80% if there is a storm for the user request
    if (stormDays >= 2) highestRisk = 90;

    window.dispatchEvent(
      new CustomEvent("ml-disaster-updated", {
        detail: {
          risk: highestRisk,
          type: disasterType,
          message: message,
        },
      }),
    );
  },
};

// Auto-init
document.addEventListener("DOMContentLoaded", () => {
  // No delay needed anymore!
  MLEngine.init();
});
