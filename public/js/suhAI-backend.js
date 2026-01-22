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
      console.log(`🔎 Searching for ${city}...`);

      // 1. Try Open-Meteo (Primary)
      try {
        const omData = await this.getOpenMeteoData(city.trim());
        console.log("✅ Using Open-Meteo Data");
        this.updateStateAndNotify(omData);
        localStorage.setItem("lastCity", city.trim());
        return; // Success, exit
      } catch (omError) {
        console.warn(
          "⚠️ Open-Meteo failed, falling back to WeatherAPI:",
          omError,
        );
      }

      // 2. Fallback to WeatherAPI (Backup)
      const weatherData = await this.getWeatherData(city.trim());
      console.log("✅ Using WeatherAPI Data (Backup)");
      this.updateStateAndNotify(weatherData);

      localStorage.setItem("lastCity", city.trim());
    } catch (error) {
      console.error("All Weather Sources Failed:", error);
      this.showNotification(
        "Kota tidak ditemukan atau layanan offline.",
        "error",
      );
    }
  }

  // --- OPEN-METEO INTEGRATION ---

  async getOpenMeteoData(city) {
    // 1. Geocoding
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found in Open-Meteo Geocoding");
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // 2. Weather Fetch
    // We need: current temp, condition, wind, humidity, pressure, daily max/min/precip

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,showers_sum,wind_speed_10m_max,precipitation_probability_max&timezone=auto&forecast_days=7`;

    const res = await fetch(weatherUrl);
    if (!res.ok) throw new Error("Open-Meteo Forecast Failed");
    const data = await res.json();

    // 3. Map to WeatherAPI Structure for compatibility
    return this.mapOpenMeteoToApp(data, name, country);
  }

  mapOpenMeteoToApp(om, cityName, country) {
    const current = om.current;
    const daily = om.daily;

    // Helper: WMO Code to Text & Icon
    const decodeWMO = (code, isDay = 1) => {
      const codes = {
        0: { text: "Cerah", icon: isDay ? "☀️" : "🌙" },
        1: { text: "Cerah Berawan", icon: "🌤️" },
        2: { text: "Berawan", icon: "☁️" },
        3: { text: "Mendung", icon: "☁️" },
        45: { text: "Berkabut", icon: "🌫️" },
        48: { text: "Kabut Es", icon: "🌫️" },
        51: { text: "Gerimis Ringan", icon: "🌧️" },
        53: { text: "Gerimis Sedang", icon: "🌧️" },
        55: { text: "Gerimis Lebat", icon: "🌧️" },
        61: { text: "Hujan Ringan", icon: "🌧️" },
        63: { text: "Hujan Sedang", icon: "🌧️" },
        65: { text: "Hujan Lebat", icon: "⛈️" },
        80: { text: "Hujan Lokal", icon: "🌦️" },
        95: { text: "Badai Petir", icon: "⚡" },
        96: { text: "Badai Petir & Hujan", icon: "⛈️" },
      };
      return codes[code] || { text: "Tidak Diketahui", icon: "❓" };
    };

    const condParam = decodeWMO(current.weather_code, current.is_day);

    return {
      location: {
        name: cityName,
        region: "", // Open-Meteo doesn't give region easily
        country: country,
        lat: om.latitude,
        lon: om.longitude,
        localtime: om.current.time.replace("T", " "), // ISO to YYYY-MM-DD HH:mm
      },
      current: {
        temp_c: current.temperature_2m,
        condition: {
          text: condParam.text,
          icon: condParam.icon, // Custom prop, standard needs url
        },
        is_day: current.is_day,
        wind_kph: current.wind_speed_10m,
        pressure_mb: current.pressure_msl,
        humidity: current.relative_humidity_2m,
        vis_km: 10, // Def
        uv: 5, // Def
        feelslike_c: current.temperature_2m, // Approx
      },
      forecast: {
        forecastday: daily.time.map((t, i) => {
          const dCond = decodeWMO(daily.weather_code[i], 1);
          return {
            date: t,
            day: {
              maxtemp_c: daily.temperature_2m_max[i],
              mintemp_c: daily.temperature_2m_min[i],
              avgtemp_c:
                (daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2,
              maxwind_kph: daily.wind_speed_10m_max[i],
              totalprecip_mm: daily.precipitation_sum[i],
              daily_chance_of_rain: daily.precipitation_probability_max
                ? daily.precipitation_probability_max[i]
                : daily.precipitation_sum[i] > 0
                  ? 80
                  : 0, // Fallback if probability missing
              condition: {
                text: dCond.text,
                icon: "//cdn.weatherapi.com/weather/64x64/day/113.png", // Placeholder URL to prevent 404
              },
            },
          };
        }),
      },
      alerts: this.analyzeDisasterRisk(daily).alerts, // Immediate Alerts
      disasterForecast: this.analyzeDisasterRisk(daily).forecast, // 7-Day Forecast
    };
  }

  analyzeDisasterRisk(daily) {
    const alerts = [];
    const forecast = [];
    const todayIndex = 0;

    // Constants for thresholds
    const THRESHOLDS = {
      flood: { rain: 50, prob: 0.8 }, // >50mm and high prob
      storm: { wind: 60, gusts: 80 },
      heat: { temp: 35 },
    };

    // 1. Analyze Immediate Alerts (Today)
    if (daily.precipitation_sum[todayIndex] > THRESHOLDS.flood.rain) {
      alerts.push({
        type: "danger",
        title: "Peringatan Banjir",
        message: `Curah hujan tinggi (${daily.precipitation_sum[todayIndex]}mm) hari ini.`,
        icon: "🌊",
      });
    }
    if (
      daily.wind_speed_10m_max[todayIndex] > THRESHOLDS.storm.wind ||
      [95, 96, 99].includes(daily.weather_code[todayIndex])
    ) {
      alerts.push({
        type: "warning",
        title: "Peringatan Badai",
        message: `Angin kencang (${daily.wind_speed_10m_max[todayIndex]} km/h) terdeteksi.`,
        icon: "🌪️",
      });
    }
    if (daily.temperature_2m_max[todayIndex] > THRESHOLDS.heat.temp) {
      alerts.push({
        type: "warning",
        title: "Gelombang Panas",
        message: `Suhu ekstrem ${daily.temperature_2m_max[todayIndex]}°C.`,
        icon: "🥵",
      });
    }

    // 2. Generate 7-Day Risk Percentages
    daily.time.forEach((t, i) => {
      // A. Flood Risk Calculation
      // Logic: Base on Rain Sum (0-100mm -> 0-100%) and Probability
      let floodScore = 0;
      const rainSum = daily.precipitation_sum[i];
      const rainProb = daily.precipitation_probability_max
        ? daily.precipitation_probability_max[i]
        : rainSum > 0
          ? 80
          : 0;

      floodScore += Math.min(rainSum * 1.5, 60); // Max 60% from amount
      floodScore += (rainProb / 100) * 40; // Max 40% from probability

      // B. Storm Risk
      let stormScore = 0;
      const wind = daily.wind_speed_10m_max[i];
      stormScore += Math.min((wind / 100) * 80, 80); // Wind speed contribution
      if ([95, 96, 99].includes(daily.weather_code[i])) stormScore += 20;

      // C. Heatwave Risk
      let heatScore = 0;
      const temp = daily.temperature_2m_max[i];
      if (temp > 30) {
        heatScore = Math.min((temp - 30) * 10, 100); // 30C=0%, 40C=100%
      }

      forecast.push({
        date: t,
        flood: Math.round(floodScore),
        storm: Math.round(stormScore),
        heat: Math.round(heatScore),
        details: {
          rain: rainSum,
          wind: wind,
          temp: temp,
        },
      });
    });

    return { alerts, forecast };
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
