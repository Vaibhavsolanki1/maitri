const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const Sentiment = require("sentiment");
const twilio = require("twilio");

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin }));

const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  mongoUri: process.env.MONGODB_URI || "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel:
    process.env.OPENROUTER_MODEL || "nvidia/nemotron-4-340b-instruct",
  openRouterBaseUrl:
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  twilioEnabled: process.env.TWILIO_ENABLED === "true",
  twilioSid: process.env.TWILIO_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioFrom: process.env.TWILIO_FROM || "",
  emergencyTo: process.env.EMERGENCY_TO || ""
};

if (!config.mongoUri) {
  console.error("Missing MONGODB_URI in environment.");
  process.exit(1);
}

if (!config.openRouterApiKey) {
  console.error("Missing OPENROUTER_API_KEY in environment.");
  process.exit(1);
}

const sentiment = new Sentiment();
let db;
let mongoClient;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function requireStringField(body, field, res) {
  if (!isNonEmptyString(body[field])) {
    res.status(400).json({ error: { message: `Missing or invalid ${field}.` } });
    return false;
  }
  return true;
}

function sanitizeVoiceText(text) {
  return String(text).replace(/[^a-zA-Z0-9 .,'-]/g, "");
}

function buildSystemPrompt({
  userName,
  emotion,
  emotionConfidence,
  communicationStyle,
  humorPreference,
  overallMood,
  vitals
}) {
  const confidenceText =
    typeof emotionConfidence === "number"
      ? `(${Math.round(emotionConfidence * 100)}% confidence)`
      : "";
  const vitalsText = vitals && typeof vitals === "object"
    ? `Vitals: HR ${vitals.hr ?? "n/a"}, SpO2 ${vitals.spo2 ?? "n/a"}, Temp ${vitals.temp ?? "n/a"}.`
    : "Vitals: n/a.";

  return [
    "You are MAITRI, a warm and supportive AI companion for people in isolated or stressful environments.",
    "Keep responses concise, empathetic, and actionable.",
    `User name: ${userName}.`,
    `Detected emotion: ${emotion} ${confidenceText}.`,
    `Communication style: ${communicationStyle}. Humor preference: ${humorPreference}. Overall mood: ${overallMood}.`,
    vitalsText
  ].join("\n");
}

async function callOpenRouter(messages) {
  const url = `${config.openRouterBaseUrl}/chat/completions`;
  const response = await axios.post(
    url,
    {
      model: config.openRouterModel,
      messages,
      temperature: 0.6,
      max_tokens: 256
    },
    {
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  );

  const text = response.data?.choices?.[0]?.message?.content;
  if (!isNonEmptyString(text)) {
    throw new Error("Empty response from OpenRouter.");
  }
  return text.trim();
}

async function updateUserProfile({ userName, message }) {
  const profiles = db.collection("user_profiles");
  const existing = await profiles.findOne({ userName });

  const wordCount = message.trim().split(/\s+/).length;
  const sentimentResult = sentiment.analyze(message);
  const sentimentScore = sentimentResult.score;
  const jokeRequested = /joke|funny|laugh|humor/i.test(message) ? 1 : 0;

  const prevMessageCount = existing?.messageCount || 0;
  const prevSentimentTotal = existing?.sentimentTotal || 0;
  const prevWordCountTotal = existing?.wordCountTotal || 0;
  const prevJokeRequestCount = existing?.jokeRequestCount || 0;

  const nextMessageCount = prevMessageCount + 1;
  const nextSentimentTotal = prevSentimentTotal + sentimentScore;
  const nextWordCountTotal = prevWordCountTotal + wordCount;
  const nextJokeRequestCount = prevJokeRequestCount + jokeRequested;

  const avgSentiment = nextSentimentTotal / nextMessageCount;
  const avgWords = nextWordCountTotal / nextMessageCount;

  const communicationStyle = avgWords < 8 ? "concise" : "detailed";
  const humorPreference = nextJokeRequestCount / nextMessageCount >= 0.2 ? "high" : "low";
  const overallMood =
    avgSentiment > 0.5 ? "positive" : avgSentiment < -0.5 ? "negative" : "neutral";

  await profiles.updateOne(
    { userName },
    {
      $set: {
        userName,
        communicationStyle,
        humorPreference,
        overallMood,
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() },
      $inc: {
        messageCount: 1,
        sentimentTotal: sentimentScore,
        wordCountTotal: wordCount,
        jokeRequestCount: jokeRequested
      }
    },
    { upsert: true }
  );
}

async function triggerEmergencyAlert(payload) {
  if (!config.twilioEnabled) {
    console.log("Twilio disabled; emergency logged.");
    return;
  }

  if (!config.twilioSid || !config.twilioAuthToken || !config.twilioFrom || !config.emergencyTo) {
    console.warn("Twilio enabled but missing credentials.");
    return;
  }

  const client = twilio(config.twilioSid, config.twilioAuthToken);
  const summary = `MAITRI emergency from ${payload.userName}. Message: ${payload.message}.`;
  const voiceMessage = sanitizeVoiceText(
    `This is a MAITRI emergency alert for ${payload.userName}. Please check the dashboard.`
  );

  await client.messages.create({
    from: config.twilioFrom,
    to: config.emergencyTo,
    body: summary
  });

  await client.calls.create({
    from: config.twilioFrom,
    to: config.emergencyTo,
    twiml: `<Response><Say>${voiceMessage}</Say></Response>`
  });
}

function wrapAsync(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post(
  "/chat",
  wrapAsync(async (req, res) => {
    const body = req.body || {};
    if (!requireStringField(body, "message", res)) {
      return;
    }

    const message = body.message.trim();
    const userName = isNonEmptyString(body.userName) ? body.userName.trim() : "Guest";
    const emotion = isNonEmptyString(body.emotion) ? body.emotion.trim() : "neutral";
    const emotionConfidence =
      typeof body.emotionConfidence === "number" ? body.emotionConfidence : null;
    const vitals = body.vitals && typeof body.vitals === "object" ? body.vitals : null;

    const profiles = db.collection("user_profiles");
    const profile = await profiles.findOne({ userName });

    const history = await db
      .collection("conversations")
      .find({ userName })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    history.reverse();

    const systemPrompt = buildSystemPrompt({
      userName,
      emotion,
      emotionConfidence,
      communicationStyle: profile?.communicationStyle || "balanced",
      humorPreference: profile?.humorPreference || "low",
      overallMood: profile?.overallMood || "neutral",
      vitals
    });

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((item) => ({ role: item.role, content: item.content })),
      { role: "user", content: message }
    ];

    const reply = await callOpenRouter(messages);
    const now = new Date();

    await db.collection("conversations").insertMany([
      {
        role: "user",
        content: message,
        userName,
        emotion,
        emotionConfidence,
        timestamp: now
      },
      {
        role: "assistant",
        content: reply,
        userName,
        emotion: null,
        emotionConfidence: null,
        timestamp: now
      }
    ]);

    updateUserProfile({ userName, message }).catch((error) => {
      console.warn("Profile update failed:", error.message);
    });

    res.json({ reply, userName, emotion, emotionConfidence });
  })
);

app.get(
  "/history",
  wrapAsync(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const userName = isNonEmptyString(req.query.userName)
      ? String(req.query.userName).trim()
      : "Guest";

    const history = await db
      .collection("conversations")
      .find({ userName })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    history.reverse();
    res.json({ userName, items: history });
  })
);

app.post(
  "/report",
  wrapAsync(async (req, res) => {
    const body = req.body || {};
    if (!requireStringField(body, "report", res)) {
      return;
    }

    const userName = isNonEmptyString(body.userName) ? body.userName.trim() : "Guest";
    const report = body.report.trim();
    const now = new Date();

    const result = await db.collection("daily_reports").insertOne({
      userName,
      report,
      timestamp: now
    });

    res.json({ ok: true, id: result.insertedId });
  })
);

app.get(
  "/reports",
  wrapAsync(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const userName = isNonEmptyString(req.query.userName)
      ? String(req.query.userName).trim()
      : "Guest";

    const reports = await db
      .collection("daily_reports")
      .find({ userName })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    res.json({ userName, items: reports });
  })
);

app.post(
  "/api/emergency",
  wrapAsync(async (req, res) => {
    const body = req.body || {};
    const userName = isNonEmptyString(body.userName) ? body.userName.trim() : "Guest";
    const message = isNonEmptyString(body.message)
      ? body.message.trim()
      : "Emergency alert triggered.";
    const vitals = body.vitals && typeof body.vitals === "object" ? body.vitals : null;
    const location = body.location && typeof body.location === "object" ? body.location : null;
    const emotion = isNonEmptyString(body.emotion) ? body.emotion.trim() : "unknown";

    const record = {
      userName,
      message,
      vitals,
      location,
      emotion,
      timestamp: new Date()
    };

    const result = await db.collection("emergencies").insertOne(record);

    triggerEmergencyAlert(record).catch((error) => {
      console.warn("Emergency alert failed:", error.message);
    });

    res.json({ ok: true, id: result.insertedId });
  })
);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: { message: "Internal server error." } });
});

async function startServer() {
  mongoClient = new MongoClient(config.mongoUri);
  await mongoClient.connect();
  db = mongoClient.db();

  app.listen(config.port, () => {
    console.log(`MAITRI backend listening on port ${config.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

process.on("SIGINT", async () => {
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});
