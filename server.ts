import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Standard pricing estimates for common TLDs when not returned as premium by Namecheap API
 * (Registration/check API only returns pricing for premium domains by default)
 */
const TLD_PRICES_ESTIMATE: Record<string, number> = {
  com: 13.98,
  net: 12.98,
  org: 14.98,
  info: 17.98,
  biz: 16.98,
  co: 28.98,
  io: 39.98,
  me: 18.98,
  app: 15.98,
  dev: 15.98,
  tech: 42.98,
  online: 32.98,
  store: 29.98,
};

/**
 * Helper to extract an attribute value from a specific XML tag using robust RegExp rules.
 * Keeps parsing lightweight and secure from XML External Entity (XXE) injections.
 */
function getXmlAttribute(xml: string, tag: string, attr: string): string | null {
  const tagRegex = new RegExp(`<${tag}[^>]*>`, "i");
  const tagMatch = xml.match(tagRegex);
  if (!tagMatch) return null;

  const attrRegex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i");
  const attrMatch = tagMatch[0].match(attrRegex);
  return attrMatch ? attrMatch[1] : null;
}

/**
 * Helper to extract standard error messages from XML response structure
 */
function getXmlError(xml: string): string | null {
  const errorMatch = xml.match(/<Error[^>]*>([\s\S]*?)<\/Error>/i);
  return errorMatch ? errorMatch[1].trim() : null;
}

const RDAP_SERVERS: Record<string, string> = {
  com: 'https://rdap.verisign.com/com/v1/domain/',
  net: 'https://rdap.verisign.com/net/v1/domain/',
  org: 'https://rdap.org/domain/',
  io:  'https://rdap.nic.io/domain/',
  co:  'https://rdap.nic.co/domain/',
  app: 'https://rdap.nic.google/domain/',
  dev: 'https://rdap.nic.google/domain/',
  info: 'https://rdap.afilias.net/rdap/info/domain/',
  biz: 'https://rdap.nic.biz/domain/',
  me:  'https://rdap.nic.me/domain/',
};

const DEFAULT_RDAP = 'https://rdap.cloudflare.com/rdap/v1/domain/';

async function checkDomain(domain: string): Promise<boolean> {
  const ext = domain.split('.').pop()?.toLowerCase() || 'com';
  const baseUrl = RDAP_SERVERS[ext] || DEFAULT_RDAP;

  const response = await fetch(`${baseUrl}${encodeURIComponent(domain)}`, {
    headers: { Accept: 'application/rdap+json' },
    signal: AbortSignal.timeout(8000),
  });

  // 404 = no registrado = disponible
  // 200 = registrado = no disponible
  return response.status === 404;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middlewares for local API routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  /**
   * Safe Proxy Endpoint to Check Domain Availability and Pricing using Namecheap API.
   * Format: GET /api/check-domain?domain=example.com
   */
  app.get("/api/check-domain", async (req, res) => {
    let domain = (req.query.domain as string || "").trim().toLowerCase();
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

    if (!domain || !domain.includes(".")) {
      return res.status(400).json({ error: "Invalid domain format" });
    }

    try {
      const available = await checkDomain(domain);
      return res.json({ available });

    } catch (err: any) {
      return res.status(502).json({ error: "Could not verify domain availability." });
    }
  });

  // Vite integration middleware config
  if (process.env.NODE_ENV !== "production") {
    console.log("[HMR] Mounting Vite middleware for active development environment...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Production Mode] Serving optimized physical static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express Engine Active] Listening securely on: http://0.0.0.0:${PORT}`);
  });
}

startServer();
