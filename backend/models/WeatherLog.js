const mongoose = require("mongoose");

const weatherLogSchema = new mongoose.Schema({
  location: { type: String, required: true },
  lat: { type: Number }, // Added for Heatmap
  lon: { type: Number }, // Added for Heatmap
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  windSpeed: { type: Number, required: true },
  pressure: { type: Number },
  conditionCodes: { type: String }, // Store text or code
  isDay: { type: Boolean },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WeatherLog", weatherLogSchema);
