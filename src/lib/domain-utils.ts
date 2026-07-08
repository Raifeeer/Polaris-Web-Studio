import dns from 'dns';
import { promisify } from 'util';

const resolveNs = promisify(dns.resolveNs);
const resolveA = promisify(dns.resolve4);
const resolveMx = promisify(dns.resolveMx);

const RDAP_SERVERS: Record<string, string> = {
  com: 'https://rdap.verisign.com/com/v1/domain/',
  net: 'https://rdap.verisign.com/net/v1/domain/',
  org: 'https://rdap.org/domain/',
  app: 'https://pubapi.registry.google/rdap/',
  dev: 'https://pubapi.registry.google/rdap/',
  info: 'https://rdap.afilias.net/rdap/info/domain/',
  biz: 'https://rdap.nic.biz/domain/',
  me:  'https://rdap.nic.me/domain/',
};

// Cloudflare's RDAP is a good generic fallback for many TLDs not explicitly listed.
const DEFAULT_RDAP = 'https://rdap.cloudflare.com/rdap/v1/domain/';

// ccTLDs that do not support RDAP or have poor RDAP support
const CCTLD_DNS_ONLY = new Set(['co', 'io']);

/**
 * Checks domain availability using DNS records (NS, A, MX).
 * If any records exist, the domain is taken (returns false).
 * If all queries fail with ENOTFOUND/ENODATA, it is available (returns true).
 */
async function checkDomainViaDns(domain: string): Promise<boolean> {
  try {
    const ns = await resolveNs(domain);
    if (ns && ns.length > 0) return false; // Taken
  } catch (err: any) {
    // Ignore error, proceed to check other records
  }

  try {
    const a = await resolveA(domain);
    if (a && a.length > 0) return false; // Taken
  } catch (err: any) {
    // Ignore error
  }

  try {
    const mx = await resolveMx(domain);
    if (mx && mx.length > 0) return false; // Taken
  } catch (err: any) {
    // Ignore error
  }

  // If no records resolved, it is available
  return true;
}

export async function checkDomainAvailability(domain: string): Promise<boolean> {
  const ext = domain.split('.').pop()?.toLowerCase();
  
  if (!ext) {
    return false; // Invalid domain
  }

  // If ccTLD that requires DNS-only check
  if (CCTLD_DNS_ONLY.has(ext)) {
    console.log(`Routing ${domain} to DNS-only check...`);
    return checkDomainViaDns(domain);
  }

  const baseUrl = RDAP_SERVERS[ext] || DEFAULT_RDAP;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout for snappy response

  try {
    const response = await fetch(`${baseUrl}${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/rdap+json' },
      signal: controller.signal,
    });
    
    if (response.status === 404) {
      return true; // Available
    } else if (response.status === 200) {
      try {
        await response.json();
        return false; // Taken
      } catch (e) {
        console.warn(`Non-JSON response from RDAP for ${domain}, falling back to DNS...`);
        return checkDomainViaDns(domain);
      }
    } else {
      console.warn(`Unexpected RDAP status ${response.status} for ${domain}, falling back to DNS...`);
      return checkDomainViaDns(domain);
    }
  } catch (error: any) {
    console.warn(`RDAP check failed/timed out for ${domain}, falling back to DNS...`, error.message || error);
    return checkDomainViaDns(domain);
  } finally {
    clearTimeout(timeoutId);
  }
}
