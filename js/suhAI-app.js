import { WeatherData } from "./suhAI-data.js";
import { SharedUtils } from "./shared.js";
import { WeatherAPIKey } from "./suhAI-backend.js";

const WeatherApp = {
  init() {
    this.setupGlobalListeners(); // Listen for backend events
    this.initDashboard();
    this.initForecastPage();
    this.startClock();
  },

  setupGlobalListeners() {
    window.addEventListener("weather-updated", async (e) => {
      console.log("Weather Update Received:", e.detail);
      const { city, data } = e.detail;

      // Merge into WeatherData (Sync)
      WeatherData.current = {
        temperature: Math.round(data.current.temp_c),
        condition: data.current.condition.text,
        feelsLike: Math.round(data.current.feelslike_c),
        humidity: data.current.humidity,
        uvIndex: data.current.uv,
        windSpeed: data.current.wind_kph,
        location: data.location.name,
        lat: data.location.lat, // Capture Lat
        lon: data.location.lon, // Capture Lon
        pressure: data.current.pressure_mb,
        visibility: data.current.vis_km,
        airQuality: "Baik", // Simplified
      };

      // If we are on main dashboard, update UI immediately
      this.updateCurrentWeather();

      // If we are on forecast page, fetch forecast data too?
      // Ideally backend does this, but we can do it here for now to keep backend simple
      if (document.getElementById("forecastList")) {
        await this.fetchAndRenderForecast(city);
      }

      // 📝 Log Data for ML Training (Throttle this in production, but okay for now)
      this.logWeatherData(WeatherData.current, data.current.is_day);
    });

    // 🧠 ML Listeners
    window.addEventListener("ml-comfort-updated", (e) => {
      const { text, color } = e.detail;
      const el = document.getElementById("comfortLabel");
      if (el) {
        el.textContent = text;
        el.className = `text-3xl font-bold transition-colors duration-500 ${color}`;
      }
    });

    window.addEventListener("ml-activities-updated", (e) => {
      const { activities } = e.detail;
      const list = document.getElementById("activityList");
      if (!list) return;

      list.innerHTML = "";
      activities.forEach((act, i) => {
        const div = document.createElement("div");
        // Vertical Card Style for Grid
        div.className =
          "flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-default border border-white/5 group animate-enter text-center gap-2";
        div.style.animationDelay = `${i * 100}ms`;

        let icon = "🎯";
        if (act.name.includes("Lari")) icon = "🏃‍♂️";
        if (act.name.includes("Jemur")) icon = "👕";
        if (act.name.includes("Ngopi")) icon = "☕";
        if (act.name.includes("Mancing")) icon = "🎣";
        if (act.name.includes("Tidur")) icon = "😴";

        div.innerHTML = `
            <div class="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center text-2xl mb-1 group-hover:scale-110 transition-transform">
                ${icon}
            </div>
            <h4 class="font-bold text-gray-200 text-sm h-10 flex items-center justify-center">${act.name}</h4>
            <div class="w-full">
                <div class="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Kecocokan</span>
                    <span>${act.score}%</span>
                </div>
                <div class="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-400" style="width: ${act.score}%"></div>
                </div>
            </div>
        `;
        list.appendChild(div);
      });
    });

    window.addEventListener("ml-prediction-ready", (e) => {
      const { forecast, trend } = e.detail;

      // Update Badge
      const badge = document.getElementById("aiTrendBadge");
      if (badge) {
        badge.textContent = `Trend: ${trend}`;
        badge.className = `px-3 py-1 rounded-full text-xs text-white font-bold ${trend.includes("Naik") ? "bg-red-500" : "bg-blue-500"}`;
      }

      // Render Chart
      const chart = document.getElementById("aiTrendChart");
      if (!chart) return;

      chart.innerHTML = ""; // Clear placeholder

      const maxT = Math.max(...forecast.map((f) => f.temp));
      const minT = Math.min(...forecast.map((f) => f.temp));
      const range = maxT - minT || 1;

      forecast.forEach((f, i) => {
        // Simplified rendering: 1 bar per hour
        const hPercent = ((f.temp - minT) / range) * 80 + 10; // 10% to 90% height

        const bar = document.createElement("div");
        bar.className =
          "flex-1 bg-gradient-to-t from-blue-500 to-purple-500 opacity-60 hover:opacity-100 transition-all rounded-t-sm relative group";
        bar.style.height = `${hPercent}%`;

        // Tooltip
        bar.innerHTML = `
                <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                    ${f.hour}:00 - ${f.temp}°C
                </div>
            `;

        chart.appendChild(bar);
      });
    });
  },

  async logWeatherData(current, isDay) {
    console.log("📤 Sending Weather Log...", current);
    try {
      const res = await fetch("/api/log-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: current.location,
          lat: WeatherData.current.lat, // New
          lon: WeatherData.current.lon, // New
          temperature: current.temperature,
          humidity: current.humidity,
          windSpeed: current.windSpeed,
          pressure: current.pressure,
          condition: current.condition,
          isDay: !!isDay,
        }),
      });
    } catch (e) {
      console.warn("Failed to log weather data:", e);
    }
  },

  initDashboard() {
    // Logic for Main Dashboard (index.html)
    if (!document.getElementById("temperature")) return;

    this.updateCurrentWeather();
  },

  async fetchAndRenderForecast(city) {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${WeatherAPIKey}&q=${city}&days=7&lang=id`,
      );
      const json = await response.json();

      WeatherData.forecast = json.forecast.forecastday.map((day) => ({
        day: new Date(day.date).toLocaleDateString("id-ID", {
          weekday: "short",
        }),
        date: new Date(day.date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
        high: Math.round(day.day.maxtemp_c),
        low: Math.round(day.day.mintemp_c),
        condition: day.day.condition.text,
        icon: day.day.avgtemp_c > 25 ? "☀️" : "☁️", // logic simplified
        precipitation: day.day.daily_chance_of_rain,
        wind: day.day.maxwind_kph,
      }));

      this.renderForecastList();
      this.renderCharts();
    } catch (e) {
      console.error("Forecast fetch failed", e);
    }
  },

  initForecastPage() {
    // Logic for Forecast Page (forecast.html)
    if (!document.getElementById("temperatureChart")) return;

    // Initial render from default data
    this.renderForecastList();
    this.renderCharts();
  },

  updateCurrentWeather() {
    const current = WeatherData.current;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set("cityName", current.location || "Jepara");
    set("weatherDesc", current.condition);
    set("temperature", current.temperature + "°");
    // Inner HTML for specific styling if needed
    if (document.getElementById("temperature"))
      document.getElementById("temperature").innerHTML =
        current.temperature + "°";

    set("feelsLike", current.feelsLike + "°C");

    // Stats
    set("humidity", current.humidity + "%");
    set("windSpeed", current.windSpeed + " km/h");
    set("pressure", current.pressure + " hPa");
    set("uvIndex", current.uvIndex);

    // Icon
    const iconEl = document.getElementById("weatherIcon");
    if (iconEl) {
      iconEl.src = this.getIconForCondition(current.condition);
    }
  },

  renderForecastList() {
    const list = document.getElementById("forecastList");
    if (!list) return;

    list.innerHTML = "";
    WeatherData.forecast.forEach((day, index) => {
      const card = document.createElement("div");
      // Add animate-enter class and dynamic delay
      card.className =
        "glassmorphism-card p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors cursor-pointer group animate-enter";
      card.style.animationDelay = `${index * 100}ms`; // Staggered delay
      card.innerHTML = `
            <span class="text-sm font-semibold opacity-70">${day.day}</span>
            <span class="text-2xl pt-1 group-hover:scale-110 transition-transform">${day.icon}</span>
            <div class="flex gap-2 mt-1">
                <span class="font-bold">${day.high}°</span>
                <span class="opacity-50">${day.low}°</span>
            </div>
            <span class="text-xs text-blue-400 mt-1">${day.precipitation}% Rain</span>
        `;
      list.appendChild(card);
    });
  },

  renderCharts() {
    // Temperature Chart
    ChartManager.createBarChart(
      "temperatureChart",
      "Temperature Trend",
      WeatherData.forecast.map((d) => d.day),
      WeatherData.forecast.map((d) => d.high),
      "#60a5fa", // blue-400
    );

    // Precipitation Chart
    ChartManager.createBarChart(
      "precipitationChart",
      "Precipitation Chance (%)",
      WeatherData.forecast.map((d) => d.day),
      WeatherData.forecast.map((d) => d.precipitation),
      "#34d399", // emerald-400
    );
  },

  getIconForCondition(condition) {
    if (!condition)
      return "https://cdn-icons-png.flaticon.com/512/869/869869.png";
    const c = condition.toLowerCase();
    if (c.includes("rain") || c.includes("hujan"))
      return "https://cdn-icons-png.flaticon.com/512/1163/1163657.png";
    if (c.includes("cloud") || c.includes("berawan"))
      return "https://cdn-icons-png.flaticon.com/512/1163/1163624.png";
    if (c.includes("storm") || c.includes("badai"))
      return "https://cdn-icons-png.flaticon.com/512/1163/1163624.png";
    return "https://cdn-icons-png.flaticon.com/512/869/869869.png";
  },

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const clockEl = document.getElementById("clock");
      const dateEl = document.getElementById("date");

      if (clockEl)
        clockEl.textContent =
          now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB";
      if (dateEl)
        dateEl.textContent = now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
    };
    updateTime();
    setInterval(updateTime, 60000);
  },
};

// Simple Chart Manager built-in (replacing external lib requirement for simplicity and performance)
const ChartManager = {
  createBarChart(containerId, label, labels, data, color) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return;

    // Reset
    ctx.innerHTML = "";

    // Dynamic Scale Calculation
    let max = Math.max(...data);
    let min = Math.min(...data);

    // Add padding to scales so bars aren't maxed out or zeroed out completely
    // If variability is low, use a tighter range to show differences
    const range = max - min;
    const padding = range === 0 ? 5 : range * 0.2; // 20% padding

    // Prevent min from being negative unless data is negative (weather usually positive here)
    let yMax = Math.ceil(max + padding);
    let yMin = Math.floor(min - padding);

    // Standardize baseline for precipitation (always 0) vs temp (variable)
    const isPrecipitation =
      containerId.toLowerCase().includes("precipitation") ||
      label.toLowerCase().includes("chance");

    if (isPrecipitation) {
      yMin = 0;
      yMax = 100; // Force percentage scale to be 0-100
    }

    const chart = document.createElement("div");
    chart.className =
      "flex items-end justify-between h-full gap-3 pt-8 pb-2 px-2 select-none relative";

    // Optional: Add gridlines or Y-axis labels here if desired for more "Premium" feel
    // For now, keeping it clean bento style

    labels.forEach((l, i) => {
      const val = data[i];

      // Calculate height percentage relative to custom yMin/yMax
      // H = (val - yMin) / (yMax - yMin) * 100
      let percent = ((val - yMin) / (yMax - yMin)) * 100;
      if (percent < 5) percent = 5; // Minimum visual height
      if (percent > 100) percent = 100;

      const barWrapper = document.createElement("div");
      barWrapper.className =
        "flex flex-col items-center justify-end w-full h-full group relative";

      const bar = document.createElement("div");
      bar.style.height = `${percent}%`;
      // Smooth animated height
      bar.style.transition = "height 0.5s cubic-bezier(0.4, 0, 0.2, 1)";

      // Variable Color intensity based on value if desired, or solid gradient
      let bgStyle = "";
      if (typeof color === "string") {
        // If hex color, use it
        bar.style.backgroundColor = color;
      }

      // Applying Bento/Glass effect to bars
      bar.className =
        "w-full rounded-t-lg opacity-80 group-hover:opacity-100 relative overflow-hidden backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.1)]";

      if (containerId.includes("temperature")) {
        // Heatmap gradient style for temp
        bar.style.background = `linear-gradient(to top, ${color}22, ${color})`;
      } else {
        bar.style.background = `linear-gradient(to top, ${color}44, ${color})`;
      }

      // Value label on top (Floating)
      const valLbl = document.createElement("div");
      valLbl.className =
        "absolute -top-6 text-xs font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1";
      valLbl.textContent = `${val}`;

      // Axis Label
      const axisLbl = document.createElement("span");
      axisLbl.className =
        "text-[10px] uppercase font-bold text-gray-500 mt-2 truncate w-full text-center tracking-wider";
      axisLbl.textContent = l;

      barWrapper.appendChild(valLbl);
      barWrapper.appendChild(bar);
      barWrapper.appendChild(axisLbl);
      chart.appendChild(barWrapper);
    });

    ctx.appendChild(chart);
  },
};

document.addEventListener("DOMContentLoaded", () => {
  WeatherApp.init();
});

window.WeatherApp = WeatherApp;
