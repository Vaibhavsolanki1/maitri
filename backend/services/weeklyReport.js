const { callOpenRouter } = require("./llm");

const EMPTY_REPORT = {
  summary: "Not enough data yet for a weekly report.",
  highlights: [],
  concerns: [],
  suggestions: []
};

function buildWeeklyMessages({ userName, summaryData }) {
  return [
    {
      role: "system",
      content:
        "You are MAITRI, a wellness summarizer. Return JSON only with keys: summary (string), highlights (array), concerns (array), suggestions (array)."
    },
    {
      role: "user",
      content: `User: ${userName}\n\nWeekly data:\n${JSON.stringify(
        summaryData,
        null,
        2
      )}`
    }
  ];
}

function normalizeList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item));
}

function parseReport(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return {
      summary: String(parsed.summary || ""),
      highlights: normalizeList(parsed.highlights),
      concerns: normalizeList(parsed.concerns),
      suggestions: normalizeList(parsed.suggestions)
    };
  } catch (error) {
    return null;
  }
}

async function generateWeeklyReport({ db, config, userName }) {
  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const conversations = await db
    .collection("conversations")
    .find({ userName, timestamp: { $gte: since } })
    .sort({ timestamp: 1 })
    .toArray();

  const reports = await db
    .collection("daily_reports")
    .find({ userName, timestamp: { $gte: since } })
    .sort({ timestamp: -1 })
    .limit(20)
    .toArray();

  if (conversations.length === 0 && reports.length === 0) {
    return {
      ...EMPTY_REPORT,
      generatedAt: now,
      timeframe: { from: since, to: now },
      sourceCounts: { conversations: 0, reports: 0, vitals: 0 }
    };
  }

  const emotionCounts = {};
  const vitalsSamples = [];
  const recentUserMessages = [];

  for (const entry of conversations) {
    if (entry.role !== "user") {
      continue;
    }

    if (entry.emotion) {
      const key = String(entry.emotion).toLowerCase();
      emotionCounts[key] = (emotionCounts[key] || 0) + 1;
    }

    if (entry.vitals && typeof entry.vitals === "object") {
      vitalsSamples.push({
        hr: entry.vitals.hr ?? null,
        spo2: entry.vitals.spo2 ?? null,
        temp: entry.vitals.temp ?? null,
        timestamp: entry.timestamp
      });
    }

    if (recentUserMessages.length < 20) {
      recentUserMessages.push({
        content: entry.content,
        emotion: entry.emotion || null,
        timestamp: entry.timestamp
      });
    }
  }

  const summaryData = {
    timeframe: { from: since, to: now },
    emotionCounts,
    vitalsSamples: vitalsSamples.slice(-20),
    recentUserMessages: recentUserMessages.slice(-20),
    reports: reports.map((report) => ({
      report: report.report,
      tags: report.tags || [],
      timestamp: report.timestamp
    }))
  };

  const messages = buildWeeklyMessages({ userName, summaryData });
  const response = await callOpenRouter({ messages, config });
  const parsed = parseReport(response.text);

  const report = parsed || {
    summary: response.text,
    highlights: [],
    concerns: [],
    suggestions: []
  };

  return {
    ...report,
    fallback: response.fallback || !parsed,
    generatedAt: now,
    timeframe: { from: since, to: now },
    sourceCounts: {
      conversations: conversations.length,
      reports: reports.length,
      vitals: vitalsSamples.length
    }
  };
}

module.exports = { generateWeeklyReport };
