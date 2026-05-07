const express = require("express");

const { asyncHandler } = require("../middleware/asyncHandler");
const { requireTier } = require("../middleware/tierGuard");
const { generateWeeklyReport } = require("../services/weeklyReport");

function createWellnessRouter({ db, config }) {
  const router = express.Router();

  router.get(
    "/api/weekly-report",
    requireTier("pro"),
    asyncHandler(async (req, res) => {
      const userName =
        typeof req.query.userName === "string" && req.query.userName.trim()
          ? req.query.userName.trim()
          : "Guest";

      const report = await generateWeeklyReport({ db, config, userName });

      return res.json(report);
    })
  );

  return router;
}

module.exports = { createWellnessRouter };
