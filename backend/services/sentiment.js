const Sentiment = require("sentiment");

const sentiment = new Sentiment();

async function updateUserProfile(db, { userName, message }) {
  const profiles = db.collection("user_profiles");
  const existing = await profiles.findOne({ userName });

  const wordCount = message.trim().split(/\s+/).length;
  const sentimentResult = sentiment.analyze(message);
  const sentimentScore = sentimentResult.score;
  const jokeRequested = /joke|funny|laugh|humor/i.test(message) ? 1 : 0;

  const prevMessageCount = existing?.messageCount || 0;
  const prevSentimentTotal = existing?.sentimentTotal || 0;
  const prevWordCountTotal = existing?.wordCountTotal || 0;
  const prevJokeRequestCount = existing?.jokeRequestCount || 0;

  const nextMessageCount = prevMessageCount + 1;
  const nextSentimentTotal = prevSentimentTotal + sentimentScore;
  const nextWordCountTotal = prevWordCountTotal + wordCount;
  const nextJokeRequestCount = prevJokeRequestCount + jokeRequested;

  const avgSentiment = nextSentimentTotal / nextMessageCount;
  const avgWords = nextWordCountTotal / nextMessageCount;

  const communicationStyle = avgWords < 8 ? "concise" : "detailed";
  const humorPreference =
    nextJokeRequestCount / nextMessageCount >= 0.2 ? "high" : "low";
  const overallMood =
    avgSentiment > 0.5
      ? "positive"
      : avgSentiment < -0.5
        ? "negative"
        : "neutral";

  await profiles.updateOne(
    { userName },
    {
      $set: {
        userName,
        communicationStyle,
        humorPreference,
        overallMood,
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() },
      $inc: {
        messageCount: 1,
        sentimentTotal: sentimentScore,
        wordCountTotal: wordCount,
        jokeRequestCount: jokeRequested
      }
    },
    { upsert: true }
  );
}

module.exports = { updateUserProfile };
