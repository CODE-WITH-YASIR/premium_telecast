/**
 * SSRF and URL validation protections for Tamil Stream Health Engine.
 * Ensures the server never attempts to probe internal loopback, private RFC 1918 networks,
 * metadata endpoints, or dangerous schemes.
 */

const PRIVATE_IP_PATTERNS = [
  /^127\.\d+\.\d+\.\d+$/, // Loopback IPv4
  /^10\.\d+\.\d+\.\d+$/, // 10.0.0.0/8
  /^192\.168\.\d+\.\d+$/, // 192.168.0.0/16
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/, // 172.16.0.0/12
  /^169\.254\.\d+\.\d+$/, // Link-local IPv4
  /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d+\.\d+$/, // Carrier-grade NAT
  /^0\.0\.0\.0$/,
  /^localhost$/i,
  /^\[::1\]$/,
  /^\[fc00:/i, // Unique local IPv6
  /^\[fe80:/i, // Link-local IPv6
];

const BLOCKED_HOST_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".lan",
  ".corp",
  ".home",
  ".arpa",
];

export interface SSRFValidationResult {
  valid: boolean;
  reason?: string;
  sanitizedUrl?: string;
}

export function validateStreamUrlSSRF(rawUrl: string): SSRFValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, reason: "Stream URL is empty or invalid" };
  }

  const trimmed = rawUrl.trim();

  // 1. Enforce length limit
  if (trimmed.length > 2048) {
    return { valid: false, reason: "Stream URL exceeds maximum length of 2048 characters" };
  }

  // 2. Parse URL
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: "Malformed URL format" };
  }

  // 3. Protocol Whitelist: strictly http: or https:
  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return {
      valid: false,
      reason: `Prohibited URL protocol "${protocol}". Only http: and https: are allowed.`,
    };
  }

  // 4. Hostname check
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname || hostname === "0.0.0.0") {
    return { valid: false, reason: "Invalid or empty hostname" };
  }

  // Check against private/loopback IP patterns
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return {
        valid: false,
        reason: `Target address "${hostname}" is restricted (private or loopback IP)`,
      };
    }
  }

  // Check blocked domain suffixes
  for (const suffix of BLOCKED_HOST_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return {
        valid: false,
        reason: `Target domain "${hostname}" is restricted (internal suffix)`,
      };
    }
  }

  // 5. Port restriction (allow standard web/streaming ports or standard IPTV ports, block SSH, SMB, database, etc.)
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    const blockedPorts = [21, 22, 23, 25, 53, 110, 135, 139, 143, 445, 1433, 1521, 3306, 5432, 6379, 27017];
    if (blockedPorts.includes(portNum)) {
      return {
        valid: false,
        reason: `Port ${portNum} is restricted for security.`,
      };
    }
  }

  return {
    valid: true,
    sanitizedUrl: parsed.toString(),
  };
}

/**
 * Sanitizes generic metadata strings against XSS, control characters, and excess whitespace.
 */
export function sanitizeMetadata(raw: string | undefined | null, maxLength = 256): string {
  if (!raw) return "";
  return raw
    .replace(/[\x00-\x1F\x7F]/g, "") // remove non-printable control chars
    .replace(/<[^>]*>?/gm, "") // strip HTML tags
    .trim()
    .slice(0, maxLength);
}
