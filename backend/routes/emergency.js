const express = require("express");

const { emergencySchema } = require("../models/validators");
const { asyncHandler } = require("../middleware/asyncHandler");
const { emergencyRateLimit } = require("../middleware/rateLimiter");
const { triggerEmergencyAlert } = require("../services/twilio");

function createEmergencyRouter({ db, config }) {
  const router = express.Router();

  router.post(
    "/api/emergency",
    emergencyRateLimit,
    asyncHandler(async (req, res) => {
      const parsed = emergencySchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: { message: "Invalid request body.", details: parsed.error.flatten() }
        });
      }

      const { userName, message, vitals, location, emotion } = parsed.data;

      const lastEmergency = await db.collection("emergencies").findOne(
        { userName },
        { sort: { timestamp: -1 } }
      );
      if (lastEmergency && new Date() - lastEmergency.timestamp < 60000) {
        return res
          .status(429)
          .json({
            error: { message: "Emergency cooldown active. Please wait 60 seconds." }
          });
      }

      const record = {
        userName,
        message,
        vitals,
        location,
        emotion,
        timestamp: new Date()
      };

      const result = await db.collection("emergencies").insertOne(record);

      triggerEmergencyAlert(config, record).catch((error) => {
        console.warn("Emergency alert failed:", error.message);
      });

      return res.json({ ok: true, id: result.insertedId });
    })
  );

  return router;
}

module.exports = { createEmergencyRouter };
