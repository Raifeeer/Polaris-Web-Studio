// Experimento temporal (10 de agosto) -- mide el timeout REAL de Edge Runtime
// en el plan Hobby, sin tocar quotebot-chat.ts. Streamea un heartbeat cada
// segundo hasta 180s o hasta que la plataforma corte la función. Se borra
// apenas se obtiene la medición real.
export const config = { runtime: "edge" };

export default function handler() {
  const encoder = new TextEncoder();
  let seconds = 0;
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        seconds++;
        controller.enqueue(encoder.encode(`tick ${seconds}\n`));
        if (seconds >= 600) {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
