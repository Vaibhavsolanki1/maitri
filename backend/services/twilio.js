const twilio = require("twilio");

function sanitizeVoiceText(text) {
  return String(text).replace(/[^a-zA-Z0-9 .,'-]/g, "");
}

async function triggerEmergencyAlert(config, payload) {
  if (!config.twilioEnabled) {
    console.log("Twilio disabled; emergency logged.");
    return;
  }

  if (
    !config.twilioSid ||
    !config.twilioAuthToken ||
    !config.twilioFrom ||
    !config.emergencyTo
  ) {
    console.warn("Twilio enabled but missing credentials.");
    return;
  }

  const client = twilio(config.twilioSid, config.twilioAuthToken);
  const summary = `MAITRI emergency from ${payload.userName}. Message: ${payload.message}.`;
  const voiceMessage = sanitizeVoiceText(
    `This is a MAITRI emergency alert for ${payload.userName}. Please check the dashboard.`
  );

  await client.messages.create({
    from: config.twilioFrom,
    to: config.emergencyTo,
    body: summary
  });

  await client.calls.create({
    from: config.twilioFrom,
    to: config.emergencyTo,
    twiml: `<Response><Say>${voiceMessage}</Say></Response>`
  });
}

module.exports = { triggerEmergencyAlert };
