const axios = require("axios");

const FALLBACK_REPLY =
  "I'm here with you. Can you tell me more about what's going on?";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function getToneGuidance(emotion) {
  const normalized = String(emotion || "").toLowerCase();

  if (normalized.includes("sad") || normalized.includes("tired")) {
    return "Use a calm, gentle tone. Offer reassurance and a small grounding step.";
  }

  if (normalized.includes("angry") || normalized.includes("frustrated")) {
    return "Use a grounding tone. Validate feelings, slow the pace, and avoid escalation.";
  }

  if (
    normalized.includes("happy") ||
    normalized.includes("excited") ||
    normalized.includes("joy")
  ) {
    return "Use an energetic, encouraging tone while staying concise.";
  }

  return "Use a warm, steady tone that feels human and supportive.";
}

function buildSystemPrompt({
  userName,
  emotion,
  emotionConfidence,
  communicationStyle,
  humorPreference,
  overallMood,
  vitals,
  emotionHistory
}) {
  const confidenceText =
    typeof emotionConfidence === "number"
      ? `(${Math.round(emotionConfidence * 100)}% confidence)`
      : "";
  const vitalsText = vitals && typeof vitals === "object"
    ? `Vitals: HR ${vitals.hr ?? "n/a"}, SpO2 ${vitals.spo2 ?? "n/a"}, Temp ${vitals.temp ?? "n/a"}.`
    : "Vitals: n/a.";
  const emotionHistoryText =
    Array.isArray(emotionHistory) && emotionHistory.length > 0
      ? `Recent emotions: ${emotionHistory.join(", ")}.`
      : "Recent emotions: n/a.";
  const toneGuidance = getToneGuidance(emotion);

  return [
    "You are MAITRI, a warm and supportive AI companion for people in isolated or stressful environments.",
    "Keep responses concise, empathetic, and actionable.",
    "Write like a human, not a robot. Use 2-4 short sentences unless the user asks for more detail.",
    "If you want to trigger a wellness action, include a tag like [ACTION:breathing], [ACTION:music], or [ACTION:yoga] at the end of your response.",
    toneGuidance,
    `User name: ${userName}.`,
    `Detected emotion: ${emotion} ${confidenceText}.`,
    `Communication style: ${communicationStyle}. Humor preference: ${humorPreference}. Overall mood: ${overallMood}.`,
    vitalsText,
    emotionHistoryText
  ].join("\n");
}

async function callOpenRouter({ messages, config, model }) {
  const url = `${config.openRouterBaseUrl}/chat/completions`;

  try {
    const response = await axios.post(
      url,
      {
        model: model || config.openRouterModel,
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
      console.error("OpenRouter returned empty content:", response.data);
      return { text: FALLBACK_REPLY, fallback: true };
    }
    return { text: text.trim(), fallback: false };
  } catch (error) {
    console.error(
      "OpenRouter request failed:",
      error.response?.data || error.message
    );
    return { text: FALLBACK_REPLY, fallback: true };
  }
}

async function callOpenRouterStream({ messages, config, onToken, model }) {
  const url = `${config.openRouterBaseUrl}/chat/completions`;

  const response = await axios.post(
    url,
    {
      model: model || config.openRouterModel,
      messages,
      temperature: 0.6,
      max_tokens: 256,
      stream: true
    },
    {
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        "Content-Type": "application/json"
      },
      responseType: "stream",
      timeout: 15000
    }
  );

  return new Promise((resolve, reject) => {
    let buffer = "";
    let fullText = "";

    response.data.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) {
          continue;
        }

        const payload = trimmed.replace(/^data:\s*/, "");
        if (payload === "[DONE]") {
          resolve({ text: fullText });
          return;
        }

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            fullText += delta;
            if (typeof onToken === "function") {
              onToken(delta);
            }
          }
        } catch (parseError) {
          console.warn("Failed to parse stream chunk:", payload);
        }
      }
    });

    response.data.on("end", () => {
      resolve({ text: fullText });
    });

    response.data.on("error", (error) => {
      reject(error);
    });
  });
}

module.exports = {
  FALLBACK_REPLY,
  buildSystemPrompt,
  callOpenRouter,
  callOpenRouterStream
};
