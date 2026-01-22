import { WeatherData } from "./suhAI-data.js";
import { SharedUtils } from "./shared.js";

const HeatmapApp = {
  map: null,
  // Expanded list of ~130 Major Cities & Regencies in Indonesia
  cities: [
    // --- JAWA ---
    { name: "Jakarta", lat: -6.2088, lon: 106.8456 },
    { name: "Surabaya", lat: -7.2575, lon: 112.7521 },
    { name: "Bandung", lat: -6.9175, lon: 107.6191 },
    { name: "Semarang", lat: -6.9667, lon: 110.4167 },
    { name: "Yogyakarta", lat: -7.7956, lon: 110.3695 },
    // { name: "Solo", lat: -7.5755, lon: 110.8243 },
    // { name: "Malang", lat: -7.9666, lon: 112.6326 },
    // { name: "Bogor", lat: -6.5971, lon: 106.806 },
    // { name: "Depok", lat: -6.4025, lon: 106.7942 },
    // { name: "Tangerang", lat: -6.1702, lon: 106.6403 },
    // { name: "Bekasi", lat: -6.2383, lon: 106.9756 },
    // { name: "Serang", lat: -6.1104, lon: 106.1636 },
    // { name: "Cirebon", lat: -6.732, lon: 108.5523 },
    // { name: "Tegal", lat: -6.8694, lon: 109.1402 },
    // { name: "Pekalongan", lat: -6.8898, lon: 109.6746 },
    // { name: "Purwokerto", lat: -7.4245, lon: 109.2302 },
    // { name: "Cilacap", lat: -7.7279, lon: 109.0077 },
    // { name: "Magelang", lat: -7.4797, lon: 110.2177 },
    // { name: "Salatiga", lat: -7.3305, lon: 110.5084 },
    // { name: "Klaten", lat: -7.7056, lon: 110.6012 },
    // { name: "Kudus", lat: -6.8048, lon: 110.8405 },
    // { name: "Jepara", lat: -6.5818, lon: 110.6696 },
    // { name: "Pati", lat: -6.757, lon: 111.038 },
    // { name: "Rembang", lat: -6.7114, lon: 111.3451 },
    // { name: "Blora", lat: -6.9698, lon: 111.4166 },
    // { name: "Bojonegoro", lat: -7.1502, lon: 111.8818 },
    // { name: "Tuban", lat: -6.8976, lon: 112.0649 },
    // { name: "Lamongan", lat: -7.1283, lon: 112.3134 },
    // { name: "Gresik", lat: -7.1539, lon: 112.6561 },
    // { name: "Sidoarjo", lat: -7.4478, lon: 112.7183 },
    // { name: "Mojokerto", lat: -7.4723, lon: 112.4338 },
    // { name: "Pasuruan", lat: -7.6453, lon: 112.9075 },
    // { name: "Probolinggo", lat: -7.7543, lon: 113.2159 },
    // { name: "Jember", lat: -8.1845, lon: 113.6681 },
    // { name: "Banyuwangi", lat: -8.2192, lon: 114.3692 },
    // { name: "Madiun", lat: -7.6298, lon: 111.5177 },
    // { name: "Kediri", lat: -7.8485, lon: 112.0178 },
    // { name: "Blitar", lat: -8.0954, lon: 112.161 },
    // { name: "Tulungagung", lat: -8.07, lon: 111.9 },

    // // --- SUMATERA ---
    // { name: "Medan", lat: 3.5952, lon: 98.6722 },
    // { name: "Palembang", lat: -2.9761, lon: 104.7754 },
    // { name: "Bandar Lampung", lat: -5.3971, lon: 105.2668 },
    // { name: "Pekanbaru", lat: 0.5071, lon: 101.4478 },
    // { name: "Padang", lat: -0.9471, lon: 100.4172 },
    // { name: "Jambi", lat: -1.6101, lon: 103.6131 },
    // { name: "Banda Aceh", lat: 5.5483, lon: 95.3238 },
    // { name: "Bengkulu", lat: -3.8004, lon: 102.2655 },
    // { name: "Batam", lat: 1.0456, lon: 104.0305 },
    // { name: "Tanjung Pinang", lat: 0.9165, lon: 104.4573 },
    // { name: "Pangkal Pinang", lat: -2.1315, lon: 106.1084 },
    // { name: "Dumai", lat: 1.6666, lon: 101.4453 },
    // { name: "Pematang Siantar", lat: 2.9634, lon: 99.0601 },
    // { name: "Binjai", lat: 3.6, lon: 98.4833 },
    // { name: "Lubuklinggau", lat: -3.2952, lon: 102.8559 },
    // { name: "Bukittinggi", lat: -0.3, lon: 100.3833 },
    // { name: "Sabang", lat: 5.8925, lon: 95.321 },
    // { name: "Lhokseumawe", lat: 5.1804, lon: 97.1435 },
    // { name: "Langsa", lat: 4.4722, lon: 97.9772 },
    // { name: "Meulaboh", lat: 4.1363, lon: 96.1285 },
    // { name: "Sibolga", lat: 1.74, lon: 98.78 },
    // { name: "Padang Sidempuan", lat: 1.3737, lon: 99.2644 },

    // // --- KALIMANTAN ---
    // { name: "Pontianak", lat: -0.0263, lon: 109.3425 },
    // { name: "Balikpapan", lat: -1.2379, lon: 116.8529 },
    // { name: "Samarinda", lat: -0.5022, lon: 117.1536 },
    // { name: "Banjarmasin", lat: -3.3194, lon: 114.5908 },
    // { name: "Palangkaraya", lat: -2.21, lon: 113.9213 },
    // { name: "Tarakan", lat: 3.3, lon: 117.6333 },
    // { name: "Singkawang", lat: 0.9111, lon: 108.9775 },
    // { name: "Bontang", lat: 0.1333, lon: 117.5 },
    // { name: "Banjarbaru", lat: -3.4411, lon: 114.8306 },
    // { name: "Sampit", lat: -2.5333, lon: 112.95 },
    // { name: "Tanjung Selor", lat: 2.8468, lon: 117.3619 },

    // // --- SULAWESI ---
    // { name: "Makassar", lat: -5.1477, lon: 119.4328 },
    // { name: "Manado", lat: 1.4748, lon: 124.8421 },
    // { name: "Palu", lat: -0.9, lon: 119.8667 },
    // { name: "Kendari", lat: -3.9972, lon: 122.5126 },
    // { name: "Gorontalo", lat: 0.5333, lon: 123.0667 },
    // { name: "Mamuju", lat: -2.6778, lon: 118.8872 },
    // { name: "Bitung", lat: 1.4428, lon: 125.1873 },
    // { name: "Palopo", lat: -2.9922, lon: 120.1983 },
    // { name: "Baubau", lat: -5.4628, lon: 122.6027 },
    // { name: "Parepare", lat: -4.0166, lon: 119.6253 },

    // // --- BALI & NUSA TENGGARA ---
    // { name: "Denpasar", lat: -8.6705, lon: 115.2126 },
    // { name: "Singaraja", lat: -8.112, lon: 115.0882 },
    // { name: "Mataram", lat: -8.5833, lon: 116.1167 },
    // { name: "Kupang", lat: -10.1772, lon: 123.607 },
    // { name: "Bima", lat: -8.4606, lon: 118.7186 },
    // { name: "Sumbawa Besar", lat: -8.5036, lon: 117.4306 },
    // { name: "Ende", lat: -8.8433, lon: 121.6622 },
    // { name: "Maumere", lat: -8.619, lon: 122.2119 },
    // { name: "Labuan Bajo", lat: -8.4964, lon: 119.8877 },

    // // --- MALUKU & PAPUA ---
    // { name: "Ambon", lat: -3.6954, lon: 128.1814 },
    // { name: "Ternate", lat: 0.7833, lon: 127.3667 },
    // { name: "Jayapura", lat: -2.5489, lon: 140.7181 },
    // { name: "Sorong", lat: -0.8756, lon: 131.2558 },
    // { name: "Manokwari", lat: -0.8615, lon: 134.062 },
    // { name: "Merauke", lat: -8.49, lon: 140.4017 },
    // { name: "Timika", lat: -4.5422, lon: 136.8833 },
    // { name: "Nabire", lat: -3.3667, lon: 135.4833 },
    // { name: "Biak", lat: -1.1833, lon: 136.0833 },
    // { name: "Fakfak", lat: -2.9242, lon: 132.2961 },
  ],

  init() {
    this.initMap();
    this.setupControls();
    this.listenForUpdates();
    this.fetchOpenMeteoHeatmap();
  },

  listenForUpdates() {
    // Listen for global weather updates to relocate map center
    window.addEventListener("weather-updated", (e) => {
      const { city, data } = e.detail;
      if (data && data.location) {
        this.updateMapLocation(data.location.lat, data.location.lon);
      }
    });
  },

  initMap() {
    // If map container doesn't exist, stop
    if (!document.getElementById("heatmapMap")) return;

    // Default center Indonesia
    this.map = L.map("heatmapMap", {
      zoomControl: false,
      attributionControl: false,
    }).setView([-2.5, 118], 5); // Wide view of Indonesia

    // Custom "Clean" Map Style
    // Using Google Hybrid (Satellite + Labels) for better visibility
    L.tileLayer("http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      attribution: "Map data &copy; Google",
    }).addTo(this.map);

    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    // Fix gray/missing map issue
    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  },

  updateMapLocation(lat, lon) {
    if (!this.map) return;
    // Fly to new location but keep zoom reasonably wide to see neighbors?
    // User probably wants to see the context of the city they searched.
    this.map.flyTo([lat, lon], 9, {
      animate: true,
      duration: 1.5,
    });
  },

  async fetchOpenMeteoHeatmap() {
    // Only fetch if map container exists (i.e., we are on the heatmap page)
    if (!document.getElementById("heatmapMap")) return;

    try {
      // Batch Fetch logic
      // API format: latitude=x,y,z&longitude=a,b,c
      const lats = this.cities.map((c) => c.lat).join(",");
      const lons = this.cities.map((c) => c.lon).join(",");

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m&timezone=auto`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Open-Meteo Heatmap API failed");

      const data = await res.json();

      let results = [];
      if (Array.isArray(data)) {
        results = data;
      } else {
        // If only 1 city was requested using commas, sometimes it parses as single?
        // Open-Meteo V1 usually returns array if commas used.
        results = [data];
        if (Array.isArray(data)) results = data; // Safety check if data IS array
      }

      // Map results back to city names
      const markers = this.cities
        .map((city, index) => {
          const reading = results[index];
          // Check validity
          if (!reading || !reading.current) return null;

          return {
            ...city,
            temp: reading.current.temperature_2m,
          };
        })
        .filter(Boolean); // Remove nulls

      this.renderMarkers(markers);
    } catch (e) {
      console.error("Heatmap Load Error:", e);
    }
  },

  renderMarkers(points) {
    if (!this.map) return;

    // Clear old layers
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    points.forEach((p) => {
      const temp = Math.round(p.temp);

      // Color Logic per reference image style
      // Cool: Blue/Green
      // Warm: Orange/Red
      let colorClass = "bg-green-500";
      if (temp > 28) colorClass = "bg-yellow-500";
      if (temp > 30) colorClass = "bg-orange-500";
      if (temp > 33) colorClass = "bg-red-500"; // Hot

      // Custom HTML Icon
      // Structure: [Dark Box Temp] [Colored Box Name]
      const html = `
            <div class="flex items-center shadow-lg group hover:scale-110 transition-transform duration-300">
                <div class="bg-gray-800 text-white font-bold text-xs px-2 py-1 rounded-l border border-gray-700">
                    ${temp}
                </div>
                <div class="${colorClass} text-white font-bold text-xs px-2 py-1 rounded-r whitespace-nowrap">
                    ${p.name}
                </div>
            </div>
        `;

      const icon = L.divIcon({
        className: "custom-heatmap-marker", // Reset default styles
        html: html,
        iconSize: [null, null], // Auto size
        iconAnchor: [20, 15], // Center approx
      });

      L.marker([p.lat, p.lon], { icon: icon }).addTo(this.map);
    });
  },

  setupControls() {
    // If we have controls like slider, hook them up here
  },
};

document.addEventListener("DOMContentLoaded", () => {
  HeatmapApp.init();
});

window.HeatmapApp = HeatmapApp;
