const express = require("express");

const { chatSchema } = require("../models/validators");
const { asyncHandler } = require("../middleware/asyncHandler");
const { chatRateLimit } = require("../middleware/rateLimiter");
const { attachTier } = require("../middleware/tierGuard");
const {
  FALLBACK_REPLY,
  buildSystemPrompt,
  callOpenRouter,
  callOpenRouterStream
} = require("../services/llm");
const { updateUserProfile } = require("../services/sentiment");

const FREE_HISTORY_DAYS = 3;
const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT_FREE = 100;
const MAX_HISTORY_LIMIT_PRO = 200;

function parseLimit(value, maxLimit) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_HISTORY_LIMIT;
  }
  return Math.min(parsed, maxLimit);
}

function extractAction(reply, message) {
  let action = null;
  let cleanedReply = reply;

  const actionMatch = reply.match(/\[ACTION:(breathing|music|yoga)\]/i);
  if (actionMatch) {
    action = actionMatch[1].toLowerCase();
    cleanedReply = reply.replace(/\[ACTION:[^\]]+\]/gi, "").trim();
  } else {
    const userMsgLower = message.toLowerCase();
    if (userMsgLower.includes("relax") || userMsgLower.includes("music")) {
      action = "music";
    } else if (
      userMsgLower.includes("breathe") ||
      userMsgLower.includes("breathing")
    ) {
      action = "breathing";
    } else if (
      userMsgLower.includes("yoga") ||
      userMsgLower.includes("stretch")
    ) {
      action = "yoga";
    }
  }

  return { reply: cleanedReply, action };
}

function createChatRouter({ db, config }) {
  const router = express.Router();

  router.post(
    "/chat",
    attachTier,
    chatRateLimit,
    asyncHandler(async (req, res) => {
      const parsed = chatSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: { message: "Invalid request body.", details: parsed.error.flatten() }
        });
      }

      const {
        message,
        userName,
        emotion,
        emotionConfidence,
        vitals,
        emotionHistory
      } = parsed.data;

      const profile = await db
        .collection("user_profiles")
        .findOne({ userName });

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
        vitals,
        emotionHistory
      });

      const messages = [
        { role: "system", content: systemPrompt },
        ...history.map((item) => ({ role: item.role, content: item.content })),
        { role: "user", content: message }
      ];

      const userTimestamp = new Date();
      const response = await callOpenRouter({ messages, config });
      const { reply, action } = extractAction(response.text, message);
      const assistantTimestamp = new Date();

      await db.collection("conversations").insertMany([
        {
          role: "user",
          content: message,
          userName,
          emotion,
          emotionConfidence,
          vitals,
          emotionHistory,
          timestamp: userTimestamp
        },
        {
          role: "assistant",
          content: reply,
          userName,
          emotion: null,
          emotionConfidence: null,
          timestamp: assistantTimestamp
        }
      ]);

      updateUserProfile(db, { userName, message }).catch((error) => {
        console.warn("Profile update failed:", error.message);
      });

      return res.json({
        reply,
        userName,
        emotion,
        emotionConfidence,
        action,
        fallback: response.fallback
      });
    })
  );

  router.post(
    "/chat/stream",
    attachTier,
    chatRateLimit,
    asyncHandler(async (req, res) => {
      const parsed = chatSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: { message: "Invalid request body.", details: parsed.error.flatten() }
        });
      }

      const {
        message,
        userName,
        emotion,
        emotionConfidence,
        vitals,
        emotionHistory
      } = parsed.data;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      if (typeof res.flushHeaders === "function") {
        res.flushHeaders();
      }

      const profile = await db
        .collection("user_profiles")
        .findOne({ userName });

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
        vitals,
        emotionHistory
      });

      const messages = [
        { role: "system", content: systemPrompt },
        ...history.map((item) => ({ role: item.role, content: item.content })),
        { role: "user", content: message }
      ];

      const userTimestamp = new Date();
      let fullReply = "";
      let fallback = false;
      let closed = false;

      req.on("close", () => {
        closed = true;
      });

      try {
        const streamResult = await callOpenRouterStream({
          messages,
          config,
          onToken: (token) => {
            fullReply += token;
            if (!closed) {
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
          }
        });

        fullReply = streamResult.text || fullReply;
      } catch (error) {
        console.error(
          "OpenRouter stream failed:",
          error.response?.data || error.message
        );
        fallback = true;
        fullReply = FALLBACK_REPLY;
        if (!closed) {
          res.write(`data: ${JSON.stringify({ token: fullReply })}\n\n`);
        }
      }

      const { reply, action } = extractAction(fullReply, message);
      const assistantTimestamp = new Date();

      await db.collection("conversations").insertMany([
        {
          role: "user",
          content: message,
          userName,
          emotion,
          emotionConfidence,
          vitals,
          emotionHistory,
          timestamp: userTimestamp
        },
        {
          role: "assistant",
          content: reply,
          userName,
          emotion: null,
          emotionConfidence: null,
          timestamp: assistantTimestamp
        }
      ]);

      updateUserProfile(db, { userName, message }).catch((error) => {
        console.warn("Profile update failed:", error.message);
      });

      if (!closed) {
        res.write(
          `data: ${JSON.stringify({ done: true, action, fallback })}\n\n`
        );
        res.end();
      }
    })
  );

  router.get(
    "/history",
    attachTier,
    asyncHandler(async (req, res) => {
      const userName =
        typeof req.query.userName === "string" && req.query.userName.trim()
          ? req.query.userName.trim()
          : "Guest";
      const maxLimit = req.tier === "pro" ? MAX_HISTORY_LIMIT_PRO : MAX_HISTORY_LIMIT_FREE;
      const limit = parseLimit(req.query.limit, maxLimit);

      const query = { userName };
      if (req.tier !== "pro") {
        const since = new Date(Date.now() - FREE_HISTORY_DAYS * 24 * 60 * 60 * 1000);
        query.timestamp = { $gte: since };
      }

      const history = await db
        .collection("conversations")
        .find(query)
        .sort({ timestamp: -1, _id: -1 })
        .limit(limit)
        .toArray();

      history.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        return String(a._id).localeCompare(String(b._id));
      });

      return res.json({ userName, items: history });
    })
  );

  return router;
}

module.exports = { createChatRouter };
