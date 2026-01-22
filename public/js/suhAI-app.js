import { WeatherData } from "./suhAI-data.js";
import { SharedUtils } from "./shared.js";
import { WeatherAPIKey } from "./suhAI-backend.js";

const WeatherApp = {
  init() {
    this.setupGlobalListeners(); // Listen for backend events
    this.initDashboard();
    this.initForecastPage();
    this.initDashboard();
    this.initForecastPage();
    this.initDisasterPage();
    this.initDisasterPage();
    this.startClock();
    this.startAutoRefresh();

    // 🚀 Auto-Init: Load last city or default
    setTimeout(() => {
      const lastCity = localStorage.getItem("lastCity") || "Jepara";
      if (window.weatherBackend) {
        console.log("🚀 Auto-initializing weather for:", lastCity);
        window.weatherBackend.performSearch(lastCity);
      }
    }, 500); // Small delay to ensure backend is ready
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

      // If we are on forecast page, update it with data from event
      if (data.forecast && data.forecast.forecastday) {
        this.processForecastData(data.forecast.forecastday);
      }

      // 📝 Log Data for ML Training (Throttle this in production, but okay for now)
      this.logWeatherData(WeatherData.current, data.current.is_day);
    });

    // 🧠 ML Listeners
    window.addEventListener("ml-comfort-updated", (e) => {
      const { text, icon, color } = e.detail;
      const el = document.getElementById("comfortLabel");
      const iconEl = document.getElementById("comfortIcon");
      if (el) {
        el.textContent = text;
        el.className = `text-3xl font-bold transition-colors duration-500 ${color}`;
      }
      if (iconEl) {
        iconEl.textContent = icon || "";
      }
    });

    window.addEventListener("ml-activities-updated", (e) => {
      const { activities } = e.detail;
      const list = document.getElementById("activityList");
      if (!list) return;

      list.innerHTML = "";
      activities.forEach((act, i) => {
        if (!act.name) return;

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
                <div class="flex justify-between items-center text-[10px] text-gray-400 mb-1 gap-2">
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

  // ... (listeners)

  processForecastData(forecastDays) {
    if (!forecastDays) return;

    WeatherData.forecast = forecastDays.map((day) => ({
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
      icon: this.getIconForCondition(day.day.condition.text), // Reuse icon logic
      precipitation: day.day.daily_chance_of_rain || 0, // Handle missing prop
      wind: day.day.maxwind_kph,
    }));

    this.renderForecastList();
    this.renderCharts();
  },

  async fetchAndRenderForecast(city) {
    // Deprecated: Logic moved to processForecastData via global event
    // Keeping empty shell if needed for compatibility/debugging reference
    // or redirect to backend search if absolutely needed
    console.warn("fetchAndRenderForecast is deprecated. Use backend search.");
    window.weatherBackend.performSearch(city);
  },

  initForecastPage() {
    // Logic for Forecast Page (forecast.html)
    if (!document.getElementById("temperatureChart")) return;

    // Initial render from default data
    this.renderForecastList();
    this.renderCharts();
  },

  initDisasterPage() {
    const matrixBody = document.getElementById("riskMatrixBody");
    if (!matrixBody) return;

    // Listen for updates to render
    window.addEventListener("weather-updated", (e) => {
      const { data } = e.detail;
      this.renderDisasterMatrix(data.disasterForecast);
      this.updateSafetyStatus(data.disasterForecast);
      this.initDisasterMap(e.detail.data.location); // Pass location
    });

    // Initial Search if empty
    // window.weatherBackend.performSearch("Jepara"); // Optional auto-init
  },

  renderDisasterMatrix(forecast) {
    const tbody = document.getElementById("riskMatrixBody");
    if (!tbody || !forecast) return;

    tbody.innerHTML = "";

    const getRiskColor = (score) => {
      if (score < 30) return "text-green-400";
      if (score < 70) return "text-yellow-400";
      return "text-red-500 font-bold";
    };

    const getRiskBg = (score) => {
      if (score < 30) return "bg-green-500";
      if (score < 70) return "bg-yellow-500";
      return "bg-red-500";
    };

    forecast.forEach((day) => {
      const dateStr = new Date(day.date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
      });

      const tr = document.createElement("tr");
      tr.className =
        "border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors";

      const renderCell = (score, label, details) => `
              <div class="flex flex-col gap-1">
                  <div class="flex justify-between items-center">
                    <span class="${getRiskColor(score)} text-lg">${score}%</span>
                    <span class="text-[10px] text-gray-500 dark:text-gray-400 opacity-70">${details}</span>
                  </div>
                  <div class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div class="h-full ${getRiskBg(score)}" style="width: ${score}%"></div>
                  </div>
              </div>
          `;

      tr.innerHTML = `
              <td class="p-3 font-medium text-gray-800 dark:text-gray-200">${dateStr}</td>
              <td class="p-3">${renderCell(day.flood, "Banjir", `${day.details.rain}mm`)}</td>
              <td class="p-3">${renderCell(day.storm, "Badai", `${day.details.wind}km/h`)}</td>
              <td class="p-3">${renderCell(day.heat, "Panas", `${day.details.temp}°C`)}</td>
          `;
      tbody.appendChild(tr);
    });
  },

  updateSafetyStatus(forecast) {
    const today = forecast[0];
    const statusEl = document.getElementById("safetyStatus");
    const msgEl = document.getElementById("safetyMessage");
    const card = document.getElementById("mainStatusCard");

    if (!statusEl) return;

    let riskLevel = "Normal";
    let riskMsg = "Kondisi cuaca terpantau aman.";
    let theme = "green";

    // Check max risk today
    const maxRisk = Math.max(today.flood, today.storm, today.heat);

    if (maxRisk > 70) {
      riskLevel = "BAHAYA";
      riskMsg =
        "Terdeteksi potensi bencana tinggi hari ini. Segera evakuasi mandiri jika diperlukan.";
      theme = "red";
    } else if (maxRisk > 30) {
      riskLevel = "WASPADA";
      riskMsg =
        "Cuaca kurang bersahabat. Tingkatkan kewaspadaan saat beraktivitas.";
      theme = "yellow"; // Orange/Yellow
    }

    statusEl.textContent = riskLevel;
    msgEl.textContent = riskMsg;

    // Update Card Theme
    if (theme === "red") {
      card.className =
        "p-4 bg-red-500/10 border border-red-500/20 rounded-xl transition-all";
      statusEl.className = "text-4xl font-bold mb-2 text-red-500";
    } else if (theme === "yellow") {
      card.className =
        "p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl transition-all";
      statusEl.className = "text-4xl font-bold mb-2 text-yellow-500";
    } else {
      card.className =
        "p-4 bg-green-500/10 border border-green-500/20 rounded-xl transition-all";
      statusEl.className = "text-4xl font-bold mb-2 text-green-500";
    }
  },

  initDisasterMap(location) {
    if (!document.getElementById("disasterMap")) return;

    // Safety check for location
    if (
      !location ||
      typeof location.lat === "undefined" ||
      typeof location.lon === "undefined"
    ) {
      console.warn("initDisasterMap: Invalid location data", location);
      return;
    }

    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);

    console.log(`🗺️ Updating Disaster Map to: ${lat}, ${lon}`);

    // If map instance exists, just FlyTo new location
    if (this.disasterMapInstance) {
      this.disasterMapInstance.setView([lat, lon], 12);
      this.disasterMapInstance.invalidateSize(); // Fix gray tiles issue

      if (this.disasterRiskCircle) {
        this.disasterMapInstance.removeLayer(this.disasterRiskCircle);
      }

      this.disasterRiskCircle = L.circle([lat, lon], {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.2,
        radius: 5000,
      }).addTo(this.disasterMapInstance);

      return;
    }

    const map = L.map("disasterMap", { attributionControl: false }).setView(
      [lat, lon],
      12,
    );

    // Use Google Hybrid (Satellite + Labels) to match user preference
    L.tileLayer("http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      attribution: "Map data &copy; Google",
    }).addTo(map);

    // Add a simple "Risk Circle" (Simulated)
    this.disasterRiskCircle = L.circle([lat, lon], {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.2,
      radius: 5000,
    }).addTo(map);

    this.disasterMapInstance = map;

    // Force redraw after a short delay to ensure container size is ready
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
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
      // Check for Custom Icon (Emoji/String) from Open-Meteo mapping
      // Standard WeatherAPI provides a full URL in icon field usually, but we might pass emoji in .text or custom field
      // The backend mapping puts emoji in .icon for Open-Meteo?
      // Let's check: mapOpenMeteoToApp sets condition.icon to emoji

      // Wait, standard WeatherAPI condition.icon is a URL.
      // If we are maintaining compatibility, we should handle both.

      // But suhAI-app.js line 286: getIconForCondition uses text text matching.
      // Let's rely on that for consistency unless it's a URL.

      const iconUrlOrEmoji = current.condition; // Wait, current.condition is text in updateStateAndNotify?
      // suhAI-app.js line 21: condition: data.current.condition.text
      // Ah, data.current.condition is an object.
      // In mapOpenMeteoToApp: condition: { text: "...", icon: "☀️" }

      // Let's see how suhAI-app.js processes the event in window.addEventListener("weather-updated")
      // Line 21: condition: data.current.condition.text

      // So current.condition in updateCurrentWeather is just TEXT.
      // The emoji icon from Open-Meteo mapping is lost here?
      // No, in line 238 calls this.getIconForCondition(current.condition).
      // That function maps text to static icons.
      // We should probably update getIconForCondition to handle more Indonesian keywords from Open-Meteo.

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
            <img src="${day.icon}" alt="${day.condition}" class="w-10 h-10 object-contain pt-1 group-hover:scale-110 transition-transform" />
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
    if (c.includes("rain") || c.includes("hujan") || c.includes("gerimis"))
      return "https://cdn-icons-png.flaticon.com/512/1163/1163657.png";
    if (
      c.includes("cloud") ||
      c.includes("berawan") ||
      c.includes("mendung") ||
      c.includes("kabut")
    )
      return "https://cdn-icons-png.flaticon.com/512/1163/1163624.png";
    if (c.includes("storm") || c.includes("badai") || c.includes("petir"))
      return "https://cdn-icons-png.flaticon.com/512/1163/1163624.png"; // Using "cloud" icon for storm temporarily or find a better storm icon?
    // The original code used 1163624 for storm too? Let's fix that.
    // 1163624 is cloud-sun-rain? No, let's stick to what was there or use a better one if possible.
    // The previous code had: if (c.includes("storm") || c.includes("badai")) return "...1163624.png";
    // Let's use a specific storm icon if I can find one in the code history?
    // No, I'll trust the user's existing icon choice, but wait, 1163624 is the same as the "cloud" one in the line above.
    // Let's use a standard storm one: https://cdn-icons-png.flaticon.com/512/1146/1146860.png (just guessing).
    // Safest is to stick to the existing URL provided in the file, which was matching cloud for storm.
    // I will optimize by ensuring "petir" maps to "badai".

    if (c.includes("cerah") || c.includes("sun"))
      return "https://cdn-icons-png.flaticon.com/512/869/869869.png";

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

  startAutoRefresh() {
    // Refresh weather data every 10 minutes (600,000 ms)
    setInterval(() => {
      const currentCity = WeatherData.current.location || "Jepara";
      console.log("🔄 Auto-refreshing data for:", currentCity);
      if (window.weatherBackend) {
        window.weatherBackend.performSearch(currentCity);
      }
    }, 600000);
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
        "absolute -top-6 text-xs font-bold text-[var(--text-main)] opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1";
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
