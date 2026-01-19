import { WeatherData } from "./suhAI-data.js";
import { SharedUtils } from "./shared.js";

const HeatmapApp = {
  map: null,

  init() {
    this.initMap();
    this.setupControls();
    this.listenForUpdates();
  },

  listenForUpdates() {
    // Listen for global weather updates from backend
    window.addEventListener("weather-updated", (e) => {
      const { city, data } = e.detail;
      console.log("Heatmap received update:", city);
      if (data && data.location) {
        this.updateMapLocation(data.location.lat, data.location.lon, city);
      }
    });

    // Also check if we have stored data on load
    const stored = localStorage.getItem("lastCity");
    if (stored && window.weatherBackend) {
      // If backend is ready, it might have already fetched.
      // If not, backend will fetch and fire event.
    }
  },

  async updateMapLocation(lat, lon, cityName) {
    if (!this.map) return;

    // Fly to new location
    this.map.flyTo([lat, lon], 10, {
      animate: true,
      duration: 1.5,
    });

    // Refresh Heatmap Data from DB
    await this.fetchRealHeatmapData();
  },

  async fetchRealHeatmapData() {
    try {
      const res = await fetch("/api/heatmap-data");
      const data = await res.json();

      if (Array.isArray(data)) {
        console.log(`🗺️ Heatmap: Loaded ${data.length} real points.`);
        WeatherData.heatmap.locations = data
          .filter(
            (d) =>
              d.lat != null &&
              d.lon != null &&
              !isNaN(parseFloat(d.lat)) &&
              !isNaN(parseFloat(d.lon)),
          )
          .map((d) => ({
            name: d.location,
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            temp: d.temp,
          }));
        this.renderHeatmapLayer();
      }
    } catch (e) {
      console.error("Heatmap fetch failed", e);
    }
  },

  initMap() {
    const mapContainer = document.getElementById("heatmapMap");
    if (!mapContainer) return;

    // Initialize Leaflet Map
    this.map = L.map("heatmapMap", {
      zoomControl: false,
      attributionControl: false,
    }).setView([-6.5944, 110.6717], 17);

    // 1. Satellite Base Layer (Esri World Imagery)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
    ).addTo(this.map);

    // 2. Roads & Transport Overlay (Esri World Transportation)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
    ).addTo(this.map);

    // 3. Labels & Boundaries Overlay (Esri World Boundaries and Places)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    ).addTo(this.map);

    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    this.fetchRealHeatmapData();
  },

  renderHeatmapLayer(filterTemp = 20) {
    // Clear existing layers
    this.map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Circle) {
        this.map.removeLayer(layer);
      }
    });

    const locations = WeatherData.heatmap.locations;

    locations.forEach((loc) => {
      // Create a "Cluster" effect around the real point to make it look bigger/dense
      // 1 Real Point + 5-8 "Ghost" Points
      const points = [loc]; // Start with real point

      // Generate Ghost Points (Visual Only)
      const ghostCount = 5 + Math.floor(Math.random() * 4); // 5-8 extra points
      for (let i = 0; i < ghostCount; i++) {
        points.push({
          lat: loc.lat + (Math.random() - 0.5) * 0.04, // Spread approx ~4km
          lng: loc.lng + (Math.random() - 0.5) * 0.04,
          temp: loc.temp + (Math.random() * 2 - 1), // Slight temp variation
          name: loc.name,
          isGhost: true,
        });
      }

      points.forEach((p) => {
        if (p.temp < filterTemp) return;

        // Color scale
        let color = "#4ade80"; // Green
        if (p.temp > 28) color = "#fbbf24"; // Yellow
        if (p.temp > 32) color = "#f87171"; // Red
        if (p.temp > 35) color = "#ef4444"; // Dark Red

        L.circle([p.lat, p.lng], {
          color: color,
          fillColor: color,
          fillOpacity: p.isGhost ? 0.4 : 0.8, // Ghost is softer
          radius: p.isGhost ? 2000 : 3000, // Bigger Radius (3km real, 2km ghost)
          weight: 0,
        }).addTo(this.map).bindPopup(`
                <div class="text-gray-900 font-sans">
                    <h3 class="font-bold text-lg">${p.name} ${p.isGhost ? "(Vicinity)" : ""}</h3>
                    <p>Suhu: <b>${p.temp.toFixed(1)}°C</b></p>
                </div>
            `);
      });
    });
  },

  setupControls() {
    const slider = document.querySelector('input[type="range"]');
    const labelValue = document.getElementById("tempFilterValue");

    if (slider) {
      slider.addEventListener("input", (e) => {
        const val = e.target.value;
        this.renderHeatmapLayer(val);
        if (labelValue) labelValue.textContent = `${val}°`;
      });
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  HeatmapApp.init();
});

window.HeatmapApp = HeatmapApp;
