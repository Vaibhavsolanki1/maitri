const dotenv = require("dotenv");

dotenv.config();

function parseBoolean(value) {
  return String(value).toLowerCase() === "true";
}

function parsePort(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseCorsOrigin(value) {
  if (!value) {
    return "*";
  }
  if (value.includes(",")) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return value;
}

const config = {
  port: parsePort(process.env.PORT, 3000),
  mongoUri: process.env.MONGODB_URI || "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel:
    process.env.OPENROUTER_MODEL || "nvidia/nemotron-nano-9b-v2:free",
  openRouterBaseUrl:
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  twilioEnabled: parseBoolean(process.env.TWILIO_ENABLED),
  twilioSid: process.env.TWILIO_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioFrom: process.env.TWILIO_FROM || "",
  emergencyTo: process.env.EMERGENCY_TO || ""
};

function validateConfig(currentConfig) {
  const missing = [];
  if (!currentConfig.mongoUri) {
    missing.push("MONGODB_URI");
  }
  if (!currentConfig.openRouterApiKey) {
    missing.push("OPENROUTER_API_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (currentConfig.twilioEnabled) {
    const twilioMissing = [];
    if (!currentConfig.twilioSid) twilioMissing.push("TWILIO_SID");
    if (!currentConfig.twilioAuthToken)
      twilioMissing.push("TWILIO_AUTH_TOKEN");
    if (!currentConfig.twilioFrom) twilioMissing.push("TWILIO_FROM");
    if (!currentConfig.emergencyTo) twilioMissing.push("EMERGENCY_TO");

    if (twilioMissing.length > 0) {
      throw new Error(
        `Twilio enabled but missing: ${twilioMissing.join(", ")}`
      );
    }
  }
}

module.exports = { config, validateConfig };
