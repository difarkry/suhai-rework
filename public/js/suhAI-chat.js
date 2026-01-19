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
    this.setupSearch();
    this.setupEmojiPicker();
    this.updateContextDisplay();
  },

  setupEmojiPicker() {
    this.btnEmoji = document.getElementById("btnEmoji");
    this.emojiPicker = document.getElementById("emojiPicker");
    this.chatInput = document.getElementById("chatInput");

    // Standard Unicode Emojis
    const emojis = [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🙂",
      "🙃",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
      "😗",
      "😙",
      "😚",
      "😋",
      "😛",
      "😝",
      "😜",
      "🤪",
      "🤨",
      "🧐",
      "🤓",
      "😎",
      "🤩",
      "🥳",
      "😏",
      "😒",
      "😞",
      "😔",
      "😟",
      "😕",
      "🙁",
      "☹️",
      "😣",
      "😖",
      "😫",
      "😩",
      "🥺",
      "😢",
      "😭",
      "😤",
      "😠",
      "😡",
      "🤬",
      "🤯",
      "😳",
      "🥵",
      "🥶",
      "😱",
      "😨",
      "😰",
      "😥",
      "😓",
      "🤗",
      "🤔",
      "🤭",
      "🤫",
      "🤥",
      "😶",
      "😐",
      "😑",
      "😬",
      "🙄",
      "😯",
      "😦",
      "😧",
      "😮",
      "😲",
      "🥱",
      "😴",
      "🤤",
      "😪",
      "😵",
      "🤐",
      "🥴",
      "🤢",
      "🤮",
      "😷",
      "🤒",
      "🤕",
      "🤑",
      "🤠",
      "😈",
      "👿",
      "👹",
      "👺",
      "🤡",
      "💩",
      "👻",
      "💀",
      "☠️",
      "👽",
      "👾",
      "🤖",
      "🎃",
      "😺",
      "😸",
      "😹",
      "😻",
      "😼",
      "😽",
      "🙀",
      "😿",
      "😾",
      "👋",
      "🤚",
      "✋",
      "🖖",
      "👌",
      "🤏",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝️",
      "👍",
      "👎",
      "✊",
      "👊",
      "🤛",
      "🤜",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "🤝",
      "🙏",
      "✍️",
      "💅",
      "💪",
      "🦾",
      "🦵",
      "🦿",
      "🦶",
      "👂",
      "🦻",
      "👃",
      "🧠",
      "🦷",
      "👀",
      "👁️",
      "👅",
      "👄",
      "💋",
      "🩸",
    ];

    // Populate
    if (this.emojiPicker) {
      this.emojiPicker.innerHTML = ""; // Clear existing
      emojis.forEach((emoji) => {
        const btn = document.createElement("button");
        btn.className = "emoji-item";
        btn.textContent = emoji;
        btn.onclick = (e) => {
          e.preventDefault();
          this.chatInput.value += emoji;
          this.chatInput.focus();
        };
        this.emojiPicker.appendChild(btn);
      });
    }

    // Toggle Logic
    const togglePicker = (show) => {
      if (show) {
        // EXCLUSIVE: Close Search if open
        if (this.sidebar.classList.contains("open")) {
          this.sidebar.classList.remove("open");
          document.removeEventListener("click", this.handleOutsideClick);
        }

        this.emojiPicker.classList.remove("hidden");
        requestAnimationFrame(() => {
          this.emojiPicker.classList.add("emoji-picker-enter");
        });
        document.addEventListener("click", this.handleOutsideEmojiClick);
      } else {
        this.emojiPicker.classList.remove("emoji-picker-enter");
        setTimeout(() => {
          this.emojiPicker.classList.add("hidden");
        }, 200);
        document.removeEventListener("click", this.handleOutsideEmojiClick);
      }
    };

    if (this.btnEmoji) {
      // Remove old listeners (best effort, though usually unique per instance)
      // this.btnEmoji.replaceWith(this.btnEmoji.cloneNode(true)); // Not safe if refs needed
      this.btnEmoji.onclick = (e) => {
        e.stopPropagation();
        const isHidden = this.emojiPicker.classList.contains("hidden");
        togglePicker(isHidden);
      };
    }

    this.handleOutsideEmojiClick = (e) => {
      if (
        this.emojiPicker &&
        !this.emojiPicker.contains(e.target) &&
        !this.btnEmoji.contains(e.target)
      ) {
        togglePicker(false);
      }
    };

    // Auto-Close on Typing or Clicking Input (Prevents obstruction)
    if (this.chatInput) {
      const closePicker = () => {
        if (!this.emojiPicker.classList.contains("hidden")) {
          togglePicker(false);
        }
      };
      this.chatInput.addEventListener("click", closePicker);
      this.chatInput.addEventListener("input", closePicker);
    }
  },

  setupSearch() {
    this.btnSearch = document.getElementById("btnSearch");
    this.sidebar = document.getElementById("searchSidebar");
    this.btnCloseSearch = document.getElementById("btnCloseSearch");
    this.searchInput = document.getElementById("searchInput");
    this.resultsContainer = document.getElementById("searchResults");
    this.noResultsMsg = document.getElementById("noResultsMsg");

    // Toggle Sidebar
    const toggleSidebar = (show) => {
      if (show) {
        // EXCLUSIVE: Close Emoji Picker if open
        if (
          this.emojiPicker &&
          !this.emojiPicker.classList.contains("hidden")
        ) {
          this.emojiPicker.classList.add("hidden");
          this.emojiPicker.classList.remove("emoji-picker-enter");
          document.removeEventListener("click", this.handleOutsideEmojiClick);
        }

        this.sidebar.classList.add("open");
        // Use timeout to allow transition to start/render
        setTimeout(() => {
          this.searchInput.focus({ preventScroll: true });
        }, 50);
        document.addEventListener("click", this.handleOutsideClick);
      } else {
        this.sidebar.classList.remove("open");
        this.searchInput.value = "";
        this.resultsContainer.innerHTML = "";
        this.resultsContainer.appendChild(this.noResultsMsg);
        this.noResultsMsg.classList.add("hidden");
        document.removeEventListener("click", this.handleOutsideClick);
      }
    };

    // Close logic handler (bound to class instance)
    this.handleOutsideClick = (e) => {
      // If click is NOT inside sidebar AND NOT on the toggle button
      if (
        !this.sidebar.contains(e.target) &&
        !this.btnSearch.contains(e.target)
      ) {
        toggleSidebar(false);
      }
    };

    if (this.btnSearch) {
      this.btnSearch.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent immediate triggering of document listener
        const isOpen = this.sidebar.classList.contains("open");
        toggleSidebar(!isOpen);
      });
    }
    if (this.btnCloseSearch) {
      this.btnCloseSearch.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSidebar(false);
      });
    }

    // Debounced Search
    let timeout;
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        clearTimeout(timeout);

        if (!query) {
          this.resultsContainer.innerHTML = "";
          this.resultsContainer.appendChild(this.noResultsMsg);
          this.noResultsMsg.classList.add("hidden");
          return;
        }

        timeout = setTimeout(() => {
          this.performSearch(query);
        }, 300); // 300ms debounce
      });
    }
  },

  performSearch(query) {
    this.resultsContainer.innerHTML = ""; // Clear previous
    this.resultsContainer.appendChild(this.noResultsMsg); // Keep Reference

    // Select Rows to identify sender
    const rows = Array.from(document.querySelectorAll(".chat-message-row"));
    let foundCount = 0;

    rows.forEach((row) => {
      // Skip welcome message if needed, or include it.
      // The bubble is inside
      const bubble = row.querySelector(".chat-bubble");
      if (!bubble) return;

      const text = bubble.textContent || "";
      if (text.toLowerCase().includes(query)) {
        foundCount++;

        // Determine Role
        const isUser = row.classList.contains("user"); // Check class
        const senderName = isUser ? "You" : "Weathera";
        const senderColor = isUser ? "text-blue-400" : "text-purple-400"; // Tailwind colors

        // Create Result Item
        const item = document.createElement("div");
        item.className = "search-result-item";

        // Highlight logic for snippet
        const regex = new RegExp(`(${query})`, "gi");
        const highlightedText = text.replace(
          regex,
          '<span class="search-highlight">$1</span>',
        );

        // Render with Sender Label
        item.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold ${senderColor}">${senderName}</span>
                <span class="text-xs text-dim ml-auto">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="text-sm text-gray-300 line-clamp-3">${highlightedText}</div>
        `;

        // Click to scroll & close
        item.addEventListener("click", (e) => {
          e.stopPropagation();

          // 1. Close Sidebar First
          this.sidebar.classList.remove("open");
          document.removeEventListener("click", this.handleOutsideClick);

          // 2. Wait for transition (300ms), then Scroll & Blink
          setTimeout(() => {
            bubble.scrollIntoView({ behavior: "smooth", block: "center" });

            // Highlight effect
            bubble.style.transition = "background 0.5s";
            const originalBg = bubble.style.backgroundColor;
            bubble.style.backgroundColor = "rgba(59, 130, 246, 0.4)"; // Stronger highlight
            setTimeout(() => {
              bubble.style.backgroundColor = originalBg;
            }, 1500);
          }, 350); // Slight buffer over 300ms transition
        });

        this.resultsContainer.appendChild(item);
      }
    });

    if (foundCount === 0) {
      this.noResultsMsg.classList.remove("hidden");
    } else {
      this.noResultsMsg.classList.add("hidden");
    }
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
    // Hide Welcome Message on first chat
    const welcomeMsg = document.getElementById("welcomeMessage");
    if (welcomeMsg) {
      welcomeMsg.remove();
    }

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
