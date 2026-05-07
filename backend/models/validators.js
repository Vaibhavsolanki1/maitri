const { z } = require("zod");

const emptyToUndefined = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const toNumber = (value) => {
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

const optionalName = z
  .preprocess(emptyToUndefined, z.string().min(1).max(50))
  .default("Guest");

const optionalEmotion = z
  .preprocess(emptyToUndefined, z.string().min(1).max(30))
  .default("neutral");

const optionalEmotionHistory = z
  .array(z.string().trim().max(30))
  .max(20)
  .default([]);

const optionalVitals = z
  .object({
    hr: z.preprocess(toNumber, z.number().min(30).max(250)).optional(),
    spo2: z.preprocess(toNumber, z.number().min(50).max(100)).optional(),
    temp: z.preprocess(toNumber, z.number().min(30).max(45)).optional()
  })
  .nullable()
  .default(null);

const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  userName: optionalName,
  emotion: optionalEmotion,
  emotionConfidence: z
    .preprocess(toNumber, z.number().min(0).max(1))
    .nullable()
    .default(null),
  vitals: optionalVitals,
  emotionHistory: optionalEmotionHistory
});

const reportSchema = z.object({
  report: z.string().trim().min(1).max(600),
  userName: optionalName,
  tags: z.array(z.string().trim().max(20)).max(10).default([])
});

const yogaSchema = z.object({
  userName: optionalName,
  pose: z.preprocess(emptyToUndefined, z.string().min(1).max(30)).default(
    "unknown"
  ),
  duration: z.preprocess(toNumber, z.number().min(0).max(3600)).default(0),
  score: z.preprocess(toNumber, z.number().min(0).max(100)).default(0)
});

const emergencySchema = z.object({
  userName: optionalName,
  message: z
    .preprocess(emptyToUndefined, z.string().max(500))
    .default("Emergency alert triggered."),
  vitals: z.object({}).passthrough().nullable().default(null),
  location: z
    .object({
      lat: z.preprocess(toNumber, z.number()),
      lng: z.preprocess(toNumber, z.number())
    })
    .nullable()
    .default(null),
  emotion: z
    .preprocess(emptyToUndefined, z.string().max(30))
    .default("unknown")
});

module.exports = {
  chatSchema,
  reportSchema,
  yogaSchema,
  emergencySchema
};
