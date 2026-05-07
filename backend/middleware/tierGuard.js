const VALID_TIERS = new Set(["free", "pro"]);

function getTierFromRequest(req) {
  const header = req.headers["x-user-tier"];
  if (typeof header !== "string") {
    return "free";
  }

  const normalized = header.trim().toLowerCase();
  return VALID_TIERS.has(normalized) ? normalized : "free";
}

function attachTier(req, res, next) {
  req.tier = getTierFromRequest(req);
  next();
}

function requireTier(...allowedTiers) {
  const allowed = new Set(allowedTiers.map((tier) => tier.toLowerCase()));

  return (req, res, next) => {
    const tier = getTierFromRequest(req);
    req.tier = tier;

    if (!allowed.has(tier)) {
      return res.status(403).json({
        error: { message: "This feature requires MAITRI Pro." },
        upgrade: true,
        requiredTier: allowedTiers[0] || "pro"
      });
    }

    return next();
  };
}

module.exports = { attachTier, requireTier, getTierFromRequest };
