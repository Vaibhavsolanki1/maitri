const express = require("express");

const { reportSchema } = require("../models/validators");
const { asyncHandler } = require("../middleware/asyncHandler");

const DEFAULT_REPORT_LIMIT = 20;
const MAX_REPORT_LIMIT = 100;

function parseLimit(value) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_REPORT_LIMIT;
  }
  return Math.min(parsed, MAX_REPORT_LIMIT);
}

function createReportRouter({ db }) {
  const router = express.Router();

  router.post(
    "/report",
    asyncHandler(async (req, res) => {
      const parsed = reportSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: { message: "Invalid request body.", details: parsed.error.flatten() }
        });
      }

      const { report, userName, tags } = parsed.data;
      const now = new Date();

      const result = await db.collection("daily_reports").insertOne({
        userName,
        report,
        tags,
        timestamp: now
      });

      return res.json({ ok: true, id: result.insertedId });
    })
  );

  router.get(
    "/reports",
    asyncHandler(async (req, res) => {
      const limit = parseLimit(req.query.limit);
      const userName =
        typeof req.query.userName === "string" && req.query.userName.trim()
          ? req.query.userName.trim()
          : "Guest";

      const reports = await db
        .collection("daily_reports")
        .find({ userName })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return res.json({ userName, items: reports });
    })
  );

  return router;
}

module.exports = { createReportRouter };
