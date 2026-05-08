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

  let db;

  try {
    mongoClient = new MongoClient(config.mongoUri);
    await mongoClient.connect();
    db = mongoClient.db();

    try {
      await createIndexes(db);
    } catch (error) {
      console.warn("Index creation failed:", error.message);
    }
  } catch (mongoError) {
    console.warn("⚠️  MongoDB connection failed:", mongoError.message);
    console.warn("⚠️  Using in-memory storage - data will NOT persist!");
    
    // Create a mock in-memory database
    const collections = new Map();
    db = {
      collection: (name) => {
        if (!collections.has(name)) {
          collections.set(name, {
            documents: [],
            findOne: async (query) => {
              return collections.get(name).documents.find(doc => {
                for (const [key, value] of Object.entries(query)) {
                  if (doc[key] !== value) return false;
                }
                return true;
              });
            },
            find: (query = {}) => ({
              sort: (sort) => ({
                limit: (limit) => ({
                  toArray: async () => {
                    let docs = [...collections.get(name).documents];
                    if (Object.keys(query).length > 0) {
                      docs = docs.filter(doc => {
                        for (const [key, value] of Object.entries(query)) {
                          if (doc[key] !== value) return false;
                        }
                        return true;
                      });
                    }
                    if (sort) {
                      docs.sort((a, b) => {
                        for (const [key, order] of Object.entries(sort)) {
                          if (a[key] > b[key]) return order === -1 ? -1 : 1;
                          if (a[key] < b[key]) return order === -1 ? 1 : -1;
                        }
                        return 0;
                      });
                    }
                    return docs.slice(0, limit);
                  }
                })
              })
            }),
            insertOne: async (doc) => {
              const withId = { ...doc, _id: new (require('mongodb')).ObjectId() };
              collections.get(name).documents.push(withId);
              return { insertedId: withId._id };
            },
            insertMany: async (docs) => {
              const ObjectId = require('mongodb').ObjectId;
              const inserted = docs.map(doc => ({ ...doc, _id: new ObjectId() }));
              collections.get(name).documents.push(...inserted);
              return { insertedIds: inserted.map(d => d._id) };
            },
            updateOne: async (query, update) => {
              const doc = await collections.get(name).findOne(query);
              if (doc) {
                const updateOp = update.$set || update;
                Object.assign(doc, updateOp);
                return { modifiedCount: 1 };
              }
              return { modifiedCount: 0 };
            },
            createIndex: async () => true
          });
        }
        return collections.get(name);
      }
    };
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
    console.log(`✅ MAITRI backend listening on port ${config.port}`);
  });

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
