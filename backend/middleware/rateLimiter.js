const rateLimit = require("express-rate-limit");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const chatRateLimit = rateLimit({
  windowMs: ONE_DAY_MS,
  max: 10,
  skip: (req) => req.tier === "pro",
  message: {
    error: {
      message:
        "Daily chat limit reached. Upgrade to MAITRI Pro for unlimited access."
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

const emergencyRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: {
    error: {
      message: "Too many emergency requests, please try again later."
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { chatRateLimit, emergencyRateLimit };
