import CONFIG from "./config.js";

export const WeatherAPIKey = CONFIG.WEATHER_API_KEY;

class WeatherBackend {
  constructor() {
    this.API_KEY = CONFIG.WEATHER_API_KEY;
    this.currentCity = "Jepara";
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadLastCity();
    this.startAutoRefresh();
  }

  startAutoRefresh() {
    // Refresh every 10 minutes (600,000 ms)
    setInterval(() => {
      if (this.currentCity) {
        console.log("🔄 Auto-refreshing weather data...");
        this.performSearch(this.currentCity);
      }
    }, 600000);
  }

  setupEventListeners() {
    // We only attach listeners if elements exist to avoid null errors
    const attachIfExists = (id, event, handler) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(event, handler);
    };

    attachIfExists("searchBtn", "click", () => {
      const val = document.getElementById("weatherSearch")?.value;
      if (val) this.performSearch(val);
    });

    attachIfExists("weatherSearch", "keypress", (e) => {
      if (e.key === "Enter") this.performSearch(e.target.value);
    });
  }

  async performSearch(city) {
    if (!city || city.trim() === "") return;

    try {
      const weatherData = await this.getWeatherData(city.trim());
      this.updateStateAndNotify(weatherData);

      localStorage.setItem("lastCity", city.trim());
    } catch (error) {
      console.error("Search error:", error);
      this.showNotification("Kota tidak ditemukan.", "error");
    }
  }

  async getWeatherData(location) {
    // Helper to format date YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split("T")[0];

    // 1. Forecast (Try 14 days)
    const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${this.API_KEY}&q=${location}&days=14&aqi=yes&lang=id`;

    // 2. History (Last 7 days)
    const endDt = new Date();
    endDt.setDate(endDt.getDate() - 1); // Yesterday
    const startDt = new Date();
    startDt.setDate(startDt.getDate() - 7); // 7 days ago

    const historyUrl = `https://api.weatherapi.com/v1/history.json?key=${this.API_KEY}&q=${location}&dt=${formatDate(startDt)}&end_dt=${formatDate(endDt)}&lang=id`;

    try {
      const [forecastRes, historyRes] = await Promise.all([
        fetch(forecastUrl),
        fetch(historyUrl).catch((e) => null), // Catch network errors for history
      ]);

      if (!forecastRes.ok) throw new Error("Kota tidak ditemukan");
      const forecastData = await forecastRes.json();

      let combinedData = { ...forecastData };

      // Try to merge history if available
      if (historyRes && historyRes.ok) {
        try {
          const historyData = await historyRes.json();
          if (historyData.forecast && historyData.forecast.forecastday) {
            combinedData.forecast.forecastday = [
              ...historyData.forecast.forecastday,
              ...combinedData.forecast.forecastday,
            ];
            console.log("✅ History data merged");
          }
        } catch (e) {
          console.warn("Skipping history merge due to parse error/limit", e);
        }
      } else {
        console.warn("History API failed or not supported by key plan.");
      }

      return combinedData;
    } catch (error) {
      console.error("Weather Fetch Error:", error);
      throw error;
    }
  }

  updateStateAndNotify(data) {
    this.currentCity = data.location.name;

    // Dispatch global event with new data
    // suhAI-app.js will listen to this and update UI
    const event = new CustomEvent("weather-updated", {
      detail: {
        city: this.currentCity,
        data: data,
      },
    });
    window.dispatchEvent(event);
  }

  loadLastCity() {
    let lastCity = localStorage.getItem("lastCity") || "Jepara";
    this.performSearch(lastCity);
  }

  showNotification(msg, type = "info") {
    // Simple toast
    const div = document.createElement("div");
    div.className = `fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 text-white font-bold animate-pulse ${
      type === "error" ? "bg-red-500" : "bg-blue-500"
    }`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  window.weatherBackend = new WeatherBackend();
});
