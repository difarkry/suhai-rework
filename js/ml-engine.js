import { WeatherData } from "./suhAI-data.js";

export const MLEngine = {
  isReady: false,
  model: null,

  async init() {
    console.log("🧠 Weathera ML Engine Initializing...");
    await tf.ready();
    this.isReady = true;
    console.log("🧠 TensorFlow.js Ready!");

    // Determine which features to run based on available data
    this.setupListeners();
    this.trainTrendModel(WeatherData.current?.location || "Jepara");
    this.predictComfort();
    this.recommendActivities();
  },

  setupListeners() {
    window.addEventListener("weather-updated", (e) => {
      const { city } = e.detail;
      console.log(
        `🧠 ML: Context switched to ${city}. Retraining/Recalculating...`,
      );

      // Re-run all ML modules with new data
      this.trainTrendModel(city);
      this.predictComfort();
      this.recommendActivities();
    });
  },

  async trainTrendModel(city = "Jepara") {
    console.log(`🧠 ML: Loading Training Data for ${city}...`);
    // 1. Fetch Data (DB + API fallback if DB empty)
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
        `🧠 ML: Not enough history for ${city} (${history.length}). Skipping trend model.`,
      );
      // Still trigger predictions so UI doesn't stale
      return;
    }

    console.log(`🧠 ML: Training on ${history.length} data points...`);

    // Prepare Data: Use time (hour) and temp
    // Simple Model: Predict Temp based on Hour
    const inputs = history.map((h) => {
      const date = new Date(h.timestamp);
      return date.getHours() / 24; // Normalize hour 0-1
    });
    const outputs = history.map((h) => h.temperature);

    const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
    const outputTensor = tf.tensor2d(outputs, [outputs.length, 1]);

    // Define Model
    const model = tf.sequential();
    model.add(
      tf.layers.dense({ units: 16, inputShape: [1], activation: "relu" }),
    );
    model.add(tf.layers.dense({ units: 16, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: "meanSquaredError",
    });

    // Train
    await model.fit(inputTensor, outputTensor, {
      epochs: 50,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0)
            console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
        },
      },
    });

    this.model = model;
    console.log("🧠 ML: Model Trained!");

    // Predict Next 24 Hours
    this.predictNext24Hours();
  },

  async predictNext24Hours() {
    if (!this.model) return;

    const next24 = [];
    const nowHour = new Date().getHours();

    for (let i = 0; i < 24; i++) {
      const h = (nowHour + i) % 24;
      const input = tf.tensor2d([h / 24], [1, 1]); // Normalized hour
      const pred = this.model.predict(input);
      const temp = (await pred.data())[0];
      next24.push({ hour: h, temp: parseFloat(temp.toFixed(1)) });
      input.dispose();
      pred.dispose();
    }

    console.log("🧠 ML Prediction (Next 24h):", next24);
    // Determine Trend
    const trend = next24[12].temp > next24[0].temp ? "Naik 📈" : "Turun 📉";

    // Dispatch Event to UI
    window.dispatchEvent(
      new CustomEvent("ml-prediction-ready", {
        detail: { forecast: next24, trend: trend },
      }),
    );
  },

  predictComfort() {
    // Fuzzy Logic-ish
    const current = WeatherData.current;
    if (!current) return;

    const T = current.temperature;
    const H = current.humidity;

    let comfort = "Nyaman 😊"; // Default
    let color = "text-green-400";

    // Logic
    if (T > 30) {
      if (H > 60) {
        comfort = "Lengket & Panas 🥵";
        color = "text-red-500";
      } else {
        comfort = "Panas Kering 🔥";
        color = "text-orange-500";
      }
    } else if (T < 24) {
      if (H > 80) {
        comfort = "Dingin Lembab 🥶";
        color = "text-blue-400";
      } else {
        comfort = "Sejuk 🍃";
        color = "text-cyan-400";
      }
    } else {
      // 24 - 30
      if (H > 75) {
        comfort = "Agak Gerah 😓";
        color = "text-yellow-400";
      }
    }

    window.dispatchEvent(
      new CustomEvent("ml-comfort-updated", {
        detail: { text: comfort, color: color },
      }),
    );
  },

  recommendActivities() {
    const current = WeatherData.current;
    if (!current) return;

    const activities = [
      {
        name: "Lari Pagi/Sore",
        goodCond: ["Cerah", "Berawan"],
        minT: 20,
        maxT: 28,
        maxRain: 0,
      },
      {
        name: "Jemur Pakaian",
        goodCond: ["Cerah"],
        minT: 25,
        maxT: 40,
        maxRain: 0,
      },
      {
        name: "Ngopi Indoor",
        goodCond: ["Hujan", "Gerimis", "Badai"],
        minT: 0,
        maxT: 40,
        maxRain: 100,
      },
      {
        name: "Mancing",
        goodCond: ["Berawan", "Mendung"],
        minT: 22,
        maxT: 30,
        maxRain: 20,
      },
      {
        name: "Tidur Siang",
        goodCond: ["Hujan"],
        minT: 20,
        maxT: 28,
        maxRain: 100,
      },
    ];

    // Calculate Score (0-100%)
    const recs = activities
      .map((act) => {
        let score = 0;

        // 1. Condition Match
        const isCondMatch = act.goodCond.some((c) =>
          current.condition.includes(c),
        );
        if (isCondMatch) score += 50;

        // 2. Temp Match
        if (current.temperature >= act.minT && current.temperature <= act.maxT)
          score += 30;

        // 3. Rain Check (Simplified)
        const isRaining =
          current.condition.toLowerCase().includes("hujan") ||
          current.condition.toLowerCase().includes("rain") ||
          current.condition.toLowerCase().includes("gerimis");

        if (isRaining && act.maxRain === 0) {
          score = 0; // HARD FILTER: Cannot validly do this activity if raining
        } else {
          if (isRaining && act.maxRain > 0) score += 20; // Good for rain activities
          if (!isRaining && act.maxRain === 0) score += 20;
        }

        return { ...act, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3

    window.dispatchEvent(
      new CustomEvent("ml-activities-updated", {
        detail: { activities: recs },
      }),
    );
  },
};

// Auto-init
document.addEventListener("DOMContentLoaded", () => {
  // Delay slightly to let other things load
  setTimeout(() => MLEngine.init(), 2000);
});
