import { WeatherData } from "./suhAI-data.js";

const ChatApp = {
  init() {
    this.historyContainer = document.getElementById("chatHistory");
    this.input = document.getElementById("chatInput");
    this.form = document.getElementById("chatForm");

    this.sessionId = "sess_" + Date.now(); // Generate Unique Session ID
    this.setupListeners();
    this.listenForWeatherUpdates();
    this.setupQuickPrompts();
    this.updateContextDisplay();
  },

  setupListeners() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = this.input.value.trim();
      if (!msg) return;

      this.handleUserMessage(msg);
      this.input.value = "";
    });
  },

  setupQuickPrompts() {
    document.querySelectorAll(".quick-prompt").forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.textContent.replace(/^[\W\d]+\s/, ""); // Remove leading emojis/numbers
        this.handleUserMessage(text.trim());
      });
    });
  },

  listenForWeatherUpdates() {
    window.addEventListener("weather-updated", (e) => {
      const data = e.detail.data;
      if (!data) return;

      // Update Current Data
      WeatherData.current = {
        location: data.location.name,
        temperature: Math.round(data.current.temp_c),
        condition: data.current.condition.text,
        windSpeed: Math.round(data.current.wind_kph),
        humidity: data.current.humidity,
        feelsLike: Math.round(data.current.feelslike_c),
        uvIndex: data.current.uv,
        visibility: data.current.vis_km,
        pressure: data.current.pressure_mb,
        isDay: data.current.is_day, // 1 = Day, 0 = Night
        airQuality: "Baik", // simplistic fallback
        localTime: data.location.localtime.split(" ")[1], // Extract "HH:MM"
      };

      // Update Forecast Data
      if (data.forecast) {
        WeatherData.forecast = data.forecast.forecastday.map((d) => ({
          date: d.date,
          day: new Date(d.date).toLocaleDateString("id-ID", {
            weekday: "long",
          }),
          high: Math.round(d.day.maxtemp_c),
          low: Math.round(d.day.mintemp_c),
          condition: d.day.condition.text,
          precipitation: d.day.daily_chance_of_rain,
        }));
      }
      this.updateContextDisplay();
    });
  },

  updateContextDisplay() {
    const current = WeatherData.current;
    if (!current.location) return;

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText("ctxCity", current.location || "Unknown");
    setText("ctxTemp", (current.temperature || "--") + "°C");
    setText("ctxCond", current.condition || "--");
  },

  addMessage(text, role = "user") {
    const div = document.createElement("div");
    // Used dedicated row class for alignment
    div.className = `chat-message-row ${role} animate-enter`;

    if (role === "user") {
      // User: Avatar on Right (handled by row-reverse in CSS)
      div.innerHTML = `
                <div class="chat-avatar user">You</div>
                <div class="chat-bubble">
                    ${text}
                </div>
            `;
    } else {
      // AI: Avatar on Left
      div.innerHTML = `
                <div class="chat-avatar ai">AI</div>
                <div class="chat-bubble">
                    ${text}
                </div>
            `;
    }

    this.historyContainer.appendChild(div);
    this.scrollToBottom();
  },

  addTypingIndicator() {
    const div = document.createElement("div");
    div.id = "typingIndicator";
    div.className = "chat-message-row ai animate-pulse";
    div.innerHTML = `
            <div class="chat-avatar ai">AI</div>
            <div class="typing-container">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
    this.historyContainer.appendChild(div);
    this.scrollToBottom();
  },

  removeTypingIndicator() {
    const el = document.getElementById("typingIndicator");
    if (el) el.remove();
  },

  scrollToBottom() {
    // Wait for DOM update
    setTimeout(() => {
      const lastMsg = this.historyContainer.lastElementChild;
      if (lastMsg) {
        lastMsg.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  },

  async handleUserMessage(msg) {
    this.addMessage(msg, "user");
    this.addTypingIndicator();

    try {
      // Collect Context
      const current = WeatherData.current;
      const forecast = WeatherData.forecast;

      console.log("SENDING AI CONTEXT:", current); // DEBUG
      console.log("Wind Speed check:", current.windSpeed); // DEBUG

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.sessionId, // Send Session ID
          message: msg,
          context: {
            location: current.location,
            localTime: current.localTime,
            isDay: current.isDay === 1 ? "Siang" : "Malam",
            temperature: current.temperature,
            condition: current.condition,
            windSpeed: current.windSpeed,
            humidity: current.humidity,
            feelsLike: current.feelsLike,
            forecast: forecast ? forecast.slice(0, 3) : [], // Send next 3 days only to save tokens
          },
        }),
      });

      const data = await response.json();
      this.removeTypingIndicator();

      if (data.reply) {
        // Render Markdown-ish response (simple replacement)
        const formattedReply = data.reply
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\n/g, "<br>");
        this.addMessage(formattedReply, "ai");
      } else if (data.error) {
        // Display specific error from server (e.g. Rate Limit)
        this.addMessage(`⚠️ ${data.error}`, "ai");
      } else {
        this.addMessage("Maaf, saya tidak bisa terhubung ke server.", "ai");
      }
    } catch (error) {
      console.error("Chat Error:", error);
      this.removeTypingIndicator();
      this.addMessage("Terjadi kesalahan jaringan. Coba lagi.", "ai");
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  ChatApp.init();
});
