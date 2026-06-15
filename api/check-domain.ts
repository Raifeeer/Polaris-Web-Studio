import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  try {
    const response = await fetch(`${baseUrl}${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/rdap+json' },
      signal: controller.signal,
    });
    return response.status === 404;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
 res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Access-Control-Allow-Methods', 'GET');

 if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

 let domain = (req.query.domain as string || '').trim().toLowerCase();
 domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

 if (!domain || !domain.includes('.')) {
   return res.status(400).json({ error: 'Invalid domain format. Example: miempresa.com' });
 }

 try {
   const available = await checkDomain(domain);
   return res.status(200).json({ available });

 } catch (err: any) {
   console.error('[Domain Check Error]', err.message);
   return res.status(502).json({ error: 'Could not verify domain availability. Please try again.' });
 }
}
