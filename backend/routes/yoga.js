const express = require("express");

const { yogaSchema } = require("../models/validators");
const { asyncHandler } = require("../middleware/asyncHandler");

function createYogaRouter({ db }) {
  const router = express.Router();

  router.post(
    "/yoga",
    asyncHandler(async (req, res) => {
      const parsed = yogaSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: { message: "Invalid request body.", details: parsed.error.flatten() }
        });
      }

      const { userName, pose, duration, score } = parsed.data;
      const now = new Date();

      const result = await db.collection("yoga_sessions").insertOne({
        userName,
        pose,
        duration,
        score,
        timestamp: now
      });

      return res.json({ ok: true, id: result.insertedId });
    })
  );

  return router;
}

module.exports = { createYogaRouter };
