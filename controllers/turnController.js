// Controller to return TURN/STUN credentials to clients
// Behavior:
// - If TURN_ICE_SERVERS_JSON is set, parse and return it (expected JSON array of iceServers)
// - Else if TURN_URL + TURN_USERNAME + TURN_PASSWORD are set, return those
// - Else if TURN_URLS (comma-separated) + TURN_USERNAME + TURN_PASSWORD are set, return those
// - Always include a public STUN server as a fallback
// - Optional simple auth: set TURN_REQUIRE_AUTH=true to require an Authorization header

export const getTurnCredentials = (req, res) => {
  const requireAuth = process.env.TURN_REQUIRE_AUTH === 'true';
  if (requireAuth && !req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('➡️  GET /api/turn/credentials from', req.ip || req.connection?.remoteAddress || 'unknown');

  // Default STUN fallback
  let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

  // 1) Full JSON override (best for complex providers)
  if (process.env.TURN_ICE_SERVERS_JSON) {
    try {
      const parsed = JSON.parse(process.env.TURN_ICE_SERVERS_JSON);
      if (Array.isArray(parsed)) {
        iceServers = parsed;
      }
    } catch (err) {
      console.warn('TURN_ICE_SERVERS_JSON is invalid JSON, falling back to other env vars');
    }
  } else if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
    // 2) Single TURN URL
    iceServers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD,
    });
  } else if (process.env.TURN_URLS && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
    // 3) Comma-separated list of URLs
    const urls = process.env.TURN_URLS.split(',').map((s) => s.trim()).filter(Boolean);
    if (urls.length) {
      iceServers.push({
        urls,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_PASSWORD,
      });
    }
  }

  // Mask credentials when logging (do not print full secret)
  const mask = (s) => {
    if (!s) return s;
    if (s.length <= 4) return '****';
    return `${s.substring(0, 2)}***${s.substring(s.length - 2)}`;
  };

  try {
    const logIce = (arr) =>
      arr.map((e) => {
        if (typeof e === 'string') return e;
        const clone = { ...e };
        if (clone.username) clone.username = mask(clone.username);
        if (clone.credential) clone.credential = mask(clone.credential);
        return clone;
      });

    console.log('⬅️  /api/turn/credentials response:', JSON.stringify({ iceServers: logIce(iceServers) }));
  } catch (err) {
    // ignore logging errors
  }

  return res.json({ iceServers });
};

export default { getTurnCredentials };
