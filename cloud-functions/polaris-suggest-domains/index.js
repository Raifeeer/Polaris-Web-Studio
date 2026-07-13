// Migrado desde api/suggest-domains.ts (Vercel) a Cloud Functions 2da gen -- mismo
// patrón que velvet-chat/chroma-chat.
const functions = require('@google-cloud/functions-framework');
const handler = require('./handler.bundle.cjs').default;

functions.http('polarisSuggestDomains', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  await handler(req, res);
});
