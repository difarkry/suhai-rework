// Shared JavaScript utilities for Bento UI
export const SharedUtils = {
  // Initialize shared functionality
  init() {
    this.initThemeToggle();
    this.setActiveNavigation();
    this.initSearchFocus();
    this.initSpotlight();
    this.initFloatingAI();
  },

  // Floating AI Button Injection (Left Side)
  initFloatingAI() {
    // Don't show on the AI page itself (redundant)
    if (window.location.pathname.includes("ai.html")) return;

    // Check if button already exists (prevent duplicates)
    if (document.querySelector(".floating-ai-btn")) return;

    const btn = document.createElement("a");
    btn.href = "/ai.html";
    btn.className = "floating-ai-btn";
    btn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <div class="floating-ai-tooltip">Ask AI</div>
    `;
    document.body.appendChild(btn);
  },

  // Theme Toggle - Persist across pages
  initThemeToggle() {
    const root = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");

    const applyTheme = (theme) => {
      if (theme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
        if (themeToggle)
          themeToggle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`; // Moon
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
        if (themeToggle)
          themeToggle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`; // Sun
      }
      localStorage.setItem("theme", theme);
    };

    // 1. Init from Storage (Default to Dark)
    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);

    // 2. Toggle Handler
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const isDark = root.classList.contains("dark");
        applyTheme(isDark ? "light" : "dark");
      });
    }
  },

  // Set active navigation based on current page
  setActiveNavigation() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");

      // Exact match or root match
      if (
        (currentPage === "/" && href === "/") ||
        (currentPage === "/index.html" && href === "/") ||
        (href !== "/" && currentPage.includes(href))
      ) {
        link.classList.add("active");
      }
    });
  },

  initSearchFocus() {
    // Add slash shortcut for search
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
      ) {
        e.preventDefault();
        const searchInput = document.getElementById("weatherSearch");
        if (searchInput) searchInput.focus();
      }
    });
  },

  // Premium Spotlight Effect
  initSpotlight() {
    const cards = document.querySelectorAll(".bento-card");
    if (!cards.length) return;

    document.addEventListener("mousemove", (e) => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });
    });
  },
};

// Auto-initialize on DOM ready
// Auto-initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    SharedUtils.init();
  });
} else {
  SharedUtils.init();
}

// Export for global access
window.SharedUtils = SharedUtils;
