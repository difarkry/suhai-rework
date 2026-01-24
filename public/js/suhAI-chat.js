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
    this.setupMenu(); // Premium Menu Logic
    this.setupEmojiPicker();
    this.updateContextDisplay();

    // Features State
    this.isTTSActive = false;
    this.isTextOnly = false;
    this.personas = [
      { id: "default", name: "Default", prompt: "" },
      {
        id: "casual",
        name: "Santai",
        prompt:
          "Gaya bicara: Santai, akrab, gunakan bahasa gaul sopan, dan banyak emoji.",
      },
      {
        id: "formal",
        name: "Formal",
        prompt:
          "Gaya bicara: Sangat formal, profesional, gunakan istilah teknis meteorologi.",
      },
      {
        id: "pantun",
        name: "Pantun",
        prompt:
          "Gaya bicara: Selalu awali atau akhiri jawaban dengan pantun cuaca yang relevan.",
      },
    ];
    this.currentPersonaIndex = 0;
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
        // EXCLUSIVE: Close Search & Menu if open
        if (this.sidebar.classList.contains("open")) {
          this.toggleSidebarRef
            ? this.toggleSidebarRef(false)
            : this.sidebar.classList.remove("open");
        }
        if (this.toggleMenuRef) this.toggleMenuRef(false);

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
        e.stopPropagation();
        const isOpen = this.sidebar.classList.contains("open");

        // Exclusive: Close Menu & Emoji if opening Search
        if (!isOpen) {
          if (this.toggleMenuRef) this.toggleMenuRef(false);
          if (this.emojiPicker) this.emojiPicker.classList.add("hidden");
        }

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

  setupMenu() {
    this.btnMenu = document.getElementById("btnMenu");
    this.menuDropdown = document.getElementById("menuDropdown");

    // Feature Elements
    this.menuAbout = document.getElementById("menuAbout");
    this.menuHelp = document.getElementById("menuHelp");
    this.menuPersona = document.getElementById("menuPersona");
    this.menuTTSToggle = document.getElementById("menuTTSToggle");
    this.toggleTTS = document.getElementById("toggleTTS");
    this.menuTextOnlyToggle = document.getElementById("menuTextOnlyToggle");
    this.toggleTextOnly = document.getElementById("toggleTextOnly");
    this.menuReport = document.getElementById("menuReport");
    this.menuDailyBrief = document.getElementById("menuDailyBrief");
    this.menuRainMonitor = document.getElementById("menuRainMonitor");
    this.currentPersonaBadge = document.getElementById("currentPersonaBadge");

    // Toggle Menu Visibility
    const toggleMenu = (show) => {
      // Expose to instance for other components
      this.toggleMenuRef = toggleMenu;

      if (show) {
        // Exclusive: Close Sidebar & Emoji
        if (this.sidebar.classList.contains("open"))
          this.toggleSidebarRef
            ? this.toggleSidebarRef(false)
            : this.sidebar.classList.remove("open");
        if (this.emojiPicker && !this.emojiPicker.classList.contains("hidden"))
          this.emojiPicker.classList.add("hidden");

        this.menuDropdown.classList.remove("hidden");
        // Force Reflow
        void this.menuDropdown.offsetWidth;

        this.menuDropdown.classList.remove("closing");
        this.menuDropdown.classList.add("open");

        document.addEventListener("click", this.handleOutsideMenuClick);
      } else {
        this.menuDropdown.classList.remove("open");
        this.menuDropdown.classList.add("closing");

        // Wait for animation
        setTimeout(() => {
          if (this.menuDropdown.classList.contains("closing")) {
            this.menuDropdown.classList.add("hidden");
            this.menuDropdown.classList.remove("closing");
          }
        }, 200); // match css duration
        document.removeEventListener("click", this.handleOutsideMenuClick);
      }
    };
    this.toggleMenuRef = toggleMenu; // Initial binding

    if (this.btnMenu) {
      this.btnMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = this.menuDropdown.classList.contains("open");
        toggleMenu(!isOpen);
      });
    }

    this.handleOutsideMenuClick = (e) => {
      if (
        this.menuDropdown &&
        !this.menuDropdown.contains(e.target) &&
        !this.btnMenu.contains(e.target)
      ) {
        toggleMenu(false);
      }
    };

    // 1. Tentang Weathera
    if (this.menuAbout) {
      this.menuAbout.addEventListener("click", () => {
        this.toggleModal("modalAbout_v2", true);
        toggleMenu(false);
      });
    }

    // 2. Bantuan
    if (this.menuHelp) {
      this.menuHelp.addEventListener("click", () => {
        this.toggleModal("modalHelp", true);
        toggleMenu(false);
      });
    }

    // 3. Ganti Gaya Bahasa (Cycle)
    if (this.menuPersona) {
      this.menuPersona.addEventListener("click", (e) => {
        e.stopPropagation();
        this.currentPersonaIndex =
          (this.currentPersonaIndex + 1) % this.personas.length;
        const p = this.personas[this.currentPersonaIndex];
        if (this.currentPersonaBadge) {
          this.currentPersonaBadge.textContent = p.name;
          this.currentPersonaBadge.classList.add("animate-pulse");
          setTimeout(
            () => this.currentPersonaBadge.classList.remove("animate-pulse"),
            500,
          );
        }
      });
    }

    // 4. Baca Suara (Toggle)
    if (this.menuTTSToggle) {
      this.menuTTSToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isTTSActive = !this.isTTSActive;

        // New Robust Logic: Toggle .active-green on the switch
        if (this.isTTSActive) {
          this.toggleTTS.classList.add("active-green");
          this.speakText("Fitur baca suara diaktifkan.");
        } else {
          this.toggleTTS.classList.remove("active-green");
          window.speechSynthesis.cancel();
        }
      });
    }

    // 5. Mode Teks Saja
    if (this.menuTextOnlyToggle) {
      this.menuTextOnlyToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isTextOnly = !this.isTextOnly;

        // New Robust Logic: Toggle .active-blue on the switch
        if (this.isTextOnly) {
          this.toggleTextOnly.classList.add("active-blue");
          this.historyContainer.classList.add("text-only-mode");
        } else {
          this.toggleTextOnly.classList.remove("active-blue");
          this.historyContainer.classList.remove("text-only-mode");
        }
      });
    }

    // 6. Laporan Jawaban
    if (this.menuReport) {
      this.menuReport.addEventListener("click", () => {
        // Mock Report
        this.showToast("Laporan jawaban terkirim. Terima kasih!");
        toggleMenu(false);
      });
    }

    // 7. Ringkasan Harian
    if (this.menuDailyBrief) {
      this.menuDailyBrief.addEventListener("click", () => {
        this.handleUserMessage(
          "Berikan ringkasan cuaca harian untuk hari ini secara lengkap.",
        );
        toggleMenu(false);
      });
    }

    // 8. Monitor Hujan
    if (this.menuRainMonitor) {
      this.menuRainMonitor.addEventListener("click", () => {
        this.handleUserMessage(
          "Pantau kondisi hujan saat ini dan potensi 3 jam ke depan.",
        );
        toggleMenu(false);
      });
    }

    // Modal Close Logic
    document.querySelectorAll(".btn-close-modal").forEach((btn) => {
      btn.addEventListener("click", () => {
        const modal = btn.closest(".fixed");
        if (modal) this.toggleModal(modal.id, false);
      });
    });
  },

  toggleModal(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    if (show) {
      el.classList.remove("hidden");
      requestAnimationFrame(() => {
        el.classList.remove("opacity-0");
        el.firstElementChild.classList.remove("scale-95");
      });
    } else {
      el.classList.add("opacity-0");
      el.firstElementChild.classList.add("scale-95");
      setTimeout(() => el.classList.add("hidden"), 300);
    }
  },

  showToast(msg) {
    let toast = document.getElementById("app-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "app-toast";
      toast.className =
        "fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 text-white px-4 py-2 rounded-lg shadow-xl z-50 text-sm opacity-0 transition-opacity duration-300 pointer-events-none";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove("opacity-0");
    setTimeout(() => toast.classList.add("opacity-0"), 3000);
  },

  speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
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
        isDay: data.current.is_day,
        airQuality: "Baik",
        localTime: data.location.localtime.split(" ")[1],
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

      // Update Disaster Data
      if (data.disasterForecast) {
        WeatherData.disaster = {
          today: data.disasterForecast[0], // Today's detailed risk
          alerts: data.alerts || [],
        };
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
            forecast: forecast ? forecast.slice(0, 3) : [],
            disaster: WeatherData.disaster || null,
            disaster: WeatherData.disaster || null,
            systemInstruction:
              (this.personas[this.currentPersonaIndex].prompt || "") +
              "\n\nJika risiko bencana tinggi (>70%), gunakan kata 'Waspada'.",
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

        // Auto-Speak if enabled
        if (this.isTTSActive) {
          // Strip HTML tags for cleaner speech
          const cleanText = data.reply.replace(/<[^>]*>?/gm, "");
          this.speakText(cleanText);
        }
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
