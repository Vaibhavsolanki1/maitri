const express = require("express");
const cors = require("cors");
const path = require("path");
const { MongoClient } = require("mongodb");

const { config, validateConfig } = require("./config");
const { createIndexes } = require("./db/indexes");
const { errorHandler } = require("./middleware/errorHandler");
const { createChatRouter } = require("./routes/chat");
const { createEmergencyRouter } = require("./routes/emergency");
const { createHealthRouter } = require("./routes/health");
const { createReportRouter } = require("./routes/report");
const { createWellnessRouter } = require("./routes/wellness");
const { createYogaRouter } = require("./routes/yoga");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: config.corsOrigin }));
app.use(express.static(path.join(__dirname, "../frontend")));

let mongoClient;
let server;
let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
}

async function startServer() {
  validateConfig(config);

  mongoClient = new MongoClient(config.mongoUri);
  await mongoClient.connect();
  const db = mongoClient.db();

  try {
    await createIndexes(db);
  } catch (error) {
    console.warn("Index creation failed:", error.message);
  }

  app.use(createHealthRouter());
  app.use(createChatRouter({ db, config }));
  app.use(createReportRouter({ db }));
  app.use(createEmergencyRouter({ db, config }));
  app.use(createYogaRouter({ db }));
  app.use(createWellnessRouter({ db, config }));

  app.get('*all', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });

  app.use(errorHandler);

  server = app.listen(config.port, () => {
    console.log(`MAITRI backend listening on port ${config.port}`);
  });

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
