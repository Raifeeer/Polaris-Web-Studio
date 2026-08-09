import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Readable } from "node:stream";

// Lectura en voz alta de las respuestas de Atlas con voces neuronales reales
// (server-side), en vez de las voces nativas del navegador -- pedido
// explícito del usuario tras quejarse del selector nativo (feo, voces
// pobres). Dos proveedores intercambiables para comparar en vivo:
// Gemini TTS (default) y Grok TTS -- ambos reusan keys que la cuenta ya
// paga y administra en otros endpoints (GEMINI_API_KEY/GROK_API_KEY).
// Generar audio real (no solo texto) tarda de verdad -- probado en vivo,
// una respuesta de ~60 palabras tomó ~19s con Gemini TTS. El default de
// Vercel Hobby (10s) cortaría eso a mitad de camino; se sube el límite real
// de la función a lo máximo permitido en Hobby para no depender del default.
export const config = { maxDuration: 60 };

const GEMINI_TTS_MODEL = "gemini-3.1-flash-tts-preview";
const GEMINI_VOICE = "Kore";
const GROK_VOICE = "eve";

const MAX_CHARS = 4000;

function pcmToWav(pcmBase64: string, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const pcm = Buffer.from(pcmBase64, "base64");
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function synthesizeGemini(text: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_VOICE } } },
        },
      }),
    }
  );
  if (!r.ok) throw new Error(`Gemini TTS ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData?.data) throw new Error("Gemini TTS: sin audio en la respuesta");
  return pcmToWav(inlineData.data);
}

// A diferencia de Gemini (que hay que bufferear completo para poder armar
// el header WAV con el tamaño real de los datos), el MP3 de Grok se puede
// reenviar en streaming real -- ni bien llega el primer chunk de la API de
// Grok, ya se lo mandamos al navegador, en vez de esperar el archivo
// completo acá y RECIÉN AHÍ empezar a mandarlo (el doble buffer -- Grok a
// nuestro servidor completo, después nuestro servidor al navegador completo
// -- era buena parte de los ~5-6s de espera reportados en vivo).
// `optimize_streaming_latency: 2` (máximo real que documenta la API de
// Grok) le pide al proveedor priorizar el primer byte por sobre la
// eficiencia de compresión.
async function streamGrok(text: string, lang: "es" | "en", res: VercelResponse): Promise<void> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("GROK_API_KEY no configurada");

  const r = await fetch("https://api.x.ai/v1/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ text, language: lang, voice_id: GROK_VOICE, optimize_streaming_latency: 2 }),
  });
  if (!r.ok) throw new Error(`Grok TTS ${r.status}: ${await r.text()}`);
  if (!r.body) throw new Error("Grok TTS: respuesta sin body");

  res.setHeader("Content-Type", r.headers.get("content-type") || "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  res.status(200);
  await new Promise<void>((resolve, reject) => {
    const nodeStream = Readable.fromWeb(r.body as any);
    nodeStream.pipe(res);
    nodeStream.on("end", resolve);
    nodeStream.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, provider, lang } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Falta texto" });
  }
  const clean = text.slice(0, MAX_CHARS);
  const voiceLang: "es" | "en" = lang === "en" ? "en" : "es";

  try {
    if (provider === "grok") {
      await streamGrok(clean, voiceLang, res);
      return res.end();
    }
    const audio = await synthesizeGemini(clean);
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(audio);
  } catch (err: any) {
    console.error("tts handler error:", err?.message || err);
    if (res.headersSent) return res.end();
    return res.status(502).json({ error: "No se pudo generar el audio" });
  }
}
