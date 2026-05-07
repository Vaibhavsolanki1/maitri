async function createIndexes(db) {
  await db
    .collection("conversations")
    .createIndex({ userName: 1, timestamp: -1 });
  await db
    .collection("daily_reports")
    .createIndex({ userName: 1, timestamp: -1 });
  await db
    .collection("emergencies")
    .createIndex({ userName: 1, timestamp: -1 });
  await db
    .collection("yoga_sessions")
    .createIndex({ userName: 1, timestamp: -1 });
  await db
    .collection("user_profiles")
    .createIndex({ userName: 1 }, { unique: true });
}

module.exports = { createIndexes };
