/**
 * Crisis Detection Service
 * Automatically detects harmful content and triggers emergency protocols
 */

const CRISIS_KEYWORDS = {
  suicide: [
    "suicide", "suicidal", "kill myself", "end my life", "no point living",
    "better off dead", "not worth living", "want to die", "going to kill myself",
    "planning to end it", "take my own life", "goodbye forever"
  ],
  selfHarm: [
    "cut myself", "cutting", "self harm", "self-harm", "self injure",
    "hurt myself", "harm myself", "slash my wrists", "bleed", "razor", "hurt"
  ],
  overdose: [
    "overdose", "pills", "take all my medication", "toxins", "poison",
    "swallow", "take everything", "lethal dose"
  ],
  violence: [
    "hurt someone", "harm others", "violent thoughts", "hit", "attack",
    "kill someone", "murder", "weapon"
  ],
  severe_distress: [
    "can't go on", "unbearable pain", "hopeless", "nothing matters",
    "trapped", "suffocating", "can't breathe", "drowning in pain",
    "breakdown", "losing it", "falling apart", "breaking down"
  ]
};

/**
 * Detect if message contains crisis indicators
 * @param {string} message - User message
 * @returns {Object} {isCrisis: boolean, severity: string, keywords: string[]}
 */
function detectCrisis(message) {
  if (!message || typeof message !== "string") {
    return { isCrisis: false, severity: "none", keywords: [] };
  }

  const lowerMessage = message.toLowerCase();
  const foundKeywords = [];
  let severity = "none";

  // Check high-risk categories first
  for (const keyword of CRISIS_KEYWORDS.suicide) {
    if (lowerMessage.includes(keyword)) {
      foundKeywords.push(keyword);
      severity = "critical";
      break;
    }
  }

  if (severity !== "critical") {
    for (const keyword of CRISIS_KEYWORDS.overdose) {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
        severity = "critical";
        break;
      }
    }
  }

  if (severity !== "critical") {
    for (const keyword of CRISIS_KEYWORDS.selfHarm) {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
        severity = "high";
        break;
      }
    }
  }

  if (severity !== "critical" && severity !== "high") {
    for (const keyword of CRISIS_KEYWORDS.violence) {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
        severity = "high";
        break;
      }
    }
  }

  if (severity === "none") {
    for (const keyword of CRISIS_KEYWORDS.severe_distress) {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
        severity = "moderate";
        break;
      }
    }
  }

  return {
    isCrisis: severity !== "none",
    severity,
    keywords: foundKeywords,
    detected: true
  };
}

/**
 * Build crisis response message
 * @param {string} severity - Severity level
 * @returns {string} Response message
 */
function getCrisisResponse(severity) {
  const baseMessage = "I'm concerned about your safety and well-being.";

  const responses = {
    critical: `${baseMessage}

🚨 IMMEDIATE SUPPORT AVAILABLE:
• National Suicide Prevention Lifeline: 1-800-273-8255 (US)
• Crisis Text Line: Text HOME to 741741
• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

Emergency services have been notified. Please reach out to someone you trust immediately.`,
    
    high: `${baseMessage}

I want to help. Please consider reaching out:
• National Suicide Prevention Lifeline: 1-800-273-8255 (US)
• Crisis Text Line: Text HOME to 741741
• You can also call 911 or go to your nearest emergency room.

Your life has value. Let's talk about what you're feeling.`,
    
    moderate: `I hear that you're in significant pain. Please know you're not alone.

Resources that might help:
• National Suicide Prevention Lifeline: 1-800-273-8255
• SAMHSA National Helpline: 1-800-662-4357

Would you like to talk about what's happening?`
  };

  return responses[severity] || responses.moderate;
}

module.exports = {
  detectCrisis,
  getCrisisResponse,
  CRISIS_KEYWORDS
};
