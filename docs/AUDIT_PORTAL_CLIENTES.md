# AUDITORÍA TÉCNICA, SEGURIDAD Y UX/UI DE PORTAL DE CLIENTES
## Polaris Web Studio

Este informe detalla los hallazgos de la auditoría profunda del **Portal de Clientes** de **Polaris Web Studio**. Se analizaron de forma exhaustiva los componentes del Frontend (`ClientDashboard.tsx`), las rutas del Backend (`server.ts`, `server-db.ts`) y el almacenamiento de persistencia plana (`portalDb.json`).

---

## 1. RESUMEN EJECUTIVO

El Portal de Clientes de Polaris Web Studio está estructurado de manera modular y presenta controles robustos de acceso basados en roles en la mayoría de sus endpoints para evitar brechas graves como IDOR (Insecure Direct Object Reference). Sin embargo, se han identificado **dos fallas críticas** que comprometen la experiencia del usuario (UX) y el consumo financiero de las APIs de Inteligencia Artificial (Gemini/Grok), junto con deficiencias técnicas en el manejo de base de datos plana y rendimiento percibido.

### Resumen de Hallazgos Clave:
| Severidad | Categoría | Descripción Breve | Impacto |
| :---: | :---: | :--- | :--- |
| **CRÍTICA** | Seguridad / Costos | API de Chat (`/api/ai/chat`) totalmente desprotegida contra abusos. Permite uso de proxy de IA gratuito por clientes autenticados. | Consumo de tokens sin control de contexto ni cuota estricta. |
| **CRÍTICA** | UX / UI | Selección de proyecto para clientes hardcodeada a `data.projects[0]`. Clientes con múltiples proyectos no pueden verlos. | Pérdida completa de funcionalidad para clientes recurrentes o multi-proyecto. |
| **MEDIA** | UX / UI | Falta absoluta de persistencia en el historial de chat con Atlas AI. | El historial se borra por completo en cada refresh de pantalla. |
| **MEDIA** | Rendimiento | Bloqueo de I/O síncrono en la base de datos plana (`fs.writeFileSync`). | El Event Loop de Node.js se bloquea en cada escritura, ralentizando toda la app bajo carga. |
| **BAJA** | UX / UI | Pantalla de carga bloqueante (Spinner opaque de pantalla completa). | Peor rendimiento percibido. No se utilizan esqueletos de carga animados (Skeletons). |

---

## 2. ANÁLISIS DE BASE DE DATOS Y ACCESO (`portalDb.json` y `server-db.ts`)

La arquitectura utiliza un archivo plano JSON (`portalDb.json`) como base de datos y una clase de abstracción en memoria (`server-db.ts`) para operar lecturas y escrituras rápidas.

### A. Bloqueo de I/O por Operaciones Síncronas
En `server-db.ts`, el método `save()` está programado de la siguiente manera:
```typescript
private save() {
  try {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.cache, null, 2), "utf-8");
  } catch (e) {
    console.error("[Db] Error saving database.", e);
  }
}
```
**Impacto:** 
`fs.writeFileSync` es una operación síncrona y bloqueante. Durante el tiempo que le toma a la máquina serializar el JSON y guardarlo en el SSD, **todo el proceso de Node.js se detiene por completo**. Ningún otro cliente puede cargar la landing page, cotizar o interactuar con el portal durante esos milisegundos.

### B. Riesgo de Concurrencia / Falta de Mecanismos de Lock
Debido a que el servidor de Polaris corre como un solo proceso en la VM de GCP, el uso de una caché síncrona en memoria mitiga el riesgo de que dos hilos editen la caché en paralelo (gracias a la naturaleza monohilo de JavaScript).
Sin embargo, **no hay un lock de archivo a nivel de sistema operativo**. Si un script externo, una tarea programada (cron), o una instancia duplicada del servidor por balanceo de carga en el futuro intenta escribir en `portalDb.json` simultáneamente:
1. El archivo se sobrescribirá de forma destructiva.
2. Habrá pérdida inmediata de consistencia en el estado de proyectos, facturas o aprobaciones.

---

## 3. SEGURIDAD Y DISEÑO DE LA API (`server.ts`)

### A. Vulnerabilidad Crítica: Bypass de Proxy AI en `/api/ai/chat`
El endpoint de chat se implementa así:
```typescript
app.post("/api/ai/chat", authenticateToken, async (req: any, res) => {
  if (!rateLimit(`ai-chat:${req.user.id}`, 30, 10 * 60 * 1000)) {
    return res.status(429).json({ error: "Demasiadas solicitudes de IA..." });
  }
  const { prompt } = req.body;
  ...
  const text = await askAI(prompt);
  res.json({ text });
});
```
Y el frontend genera la solicitud concatenando variables contextuales:
```typescript
const reply = await askAIFrontend(
  `Eres el asistente de Polaris Web Studio. ${context} El cliente pregunta: "${userMsg}". Responde en español, máximo 3 oraciones, tono cercano.`
);
```

**Análisis de Seguridad:**
El backend confía ciegamente en el `prompt` enviado por el frontend. Un cliente con conocimientos técnicos mínimos puede inspeccionar las llamadas de red y enviar peticiones directas al endpoint `/api/ai/chat` con prompts maliciosos o totalmente ajenos al negocio:
*   *Ejemplo de abuso:* `{"prompt": "Escribe un ensayo de 3000 palabras sobre la historia de Roma"}` o `{"prompt": "Genera código para un malware de encriptación"}`.
*   **Consecuencias:** Polaris Web Studio financia el uso ilimitado de IA (vía Gemini/Grok) para tareas personales de los usuarios. Además, no existe un rol que impida que un cliente desactive el sistema de cobros mediante inyección de texto si el prompt del sistema se maneja de forma débil.

### B. Análisis de Autorizaciones (IDOR) - ¡Diseño Correcto!
Es importante destacar que el backend tiene **una defensa impecable** en sus endpoints transaccionales. Los siguientes métodos verifican correctamente la propiedad de los recursos para prevenir ataques de IDOR (Insecure Direct Object Reference):

1. **Pago de Facturas (`/api/portal/invoices/:id/pay`):**
   ```typescript
   if (req.user.role !== "admin" && project.clientUserId !== req.user.id) {
     return res.status(403).json({ error: "Acceso denegado. No tiene permisos sobre esta factura." });
   }
   ```
2. **Respuesta a Entregables (`/api/portal/tasks/:id/respond`):**
   ```typescript
   if (req.user.role !== "admin" && project.clientUserId !== req.user.id) {
     return res.status(403).json({ error: "Acceso denegado. No tiene permisos sobre este proyecto." });
   }
   ```
3. **Historial de Despliegues (`/api/portal/deploys/:projectId`):**
   ```typescript
   if (req.user.role !== "admin" && project.clientUserId !== req.user.id) {
     return res.status(403).json({ error: "Acceso denegado. No tiene permisos sobre este proyecto." });
   }
   ```
*Diagnóstico:* Las barreras de autorización a nivel de base de datos son sumamente seguras. Un usuario no puede de ninguna manera interferir con proyectos, facturas o tareas ajenas.

---

## 4. ANÁLISIS DE UX/UI Y RENDIMIENTO PERCIBIDO (`ClientDashboard.tsx`)

### A. Falla Crítica de UX: Hardcodeo de Proyecto Único
En la declaración inicial del render para clientes (Línea 887):
```typescript
const clientProject = !isAdmin && data?.projects && data.projects.length > 0 ? data.projects[0] : null;
```
**Análisis del Flujo:**
Si un cliente tiene dos o más proyectos contratados con Polaris Web Studio (ej. *"Rediseño Web"* y *"Mantenimiento Anual"*), la variable `clientProject` **siempre selecciona el índice 0**. 
*   No hay ningún menú, dropdown ni pestaña que permita al cliente cambiar de proyecto.
*   Las facturas, entregables, reuniones y actualizaciones que se visualizan en el panel quedan totalmente limitadas al primer proyecto de la lista de base de datos.
*   **Fricción del Cliente:** Frustración absoluta al no poder validar entregables o pagar facturas del segundo proyecto activo, obligándolos a recurrir a canales manuales (WhatsApp/Email).

### B. Pérdida del Historial de Chat (Atlas AI)
El estado de los mensajes reside de manera efímera en la memoria RAM del componente:
```typescript
const [chatMessages, setChatMessages] = useState<{role: "user"|"assistant", text: string}[]>([]);
```
Si un cliente tiene una conversación enriquecedora con Atlas AI resolviendo dudas sobre los próximos entregables y accidentalmente presiona F5 o cierra el navegador para buscar un dato, **todo el historial se esfuma**. Esto incrementa la fricción cognitiva al tener que iniciar el hilo de conversación desde cero.

### C. Ausencia de "Skeletons" (Rendimiento Percibido Pobre)
Cuando la aplicación está obteniendo los datos del panel en la primera carga:
```tsx
if (!user || loading) {
  return (
    <div className="fixed inset-0 bg-[var(--color-surface-base)] flex flex-col items-center justify-center gap-4 z-50">
      <div className="w-12 h-12 rounded-full border-2 border-[var(--color-primary-base)] ... animate-spin" />
      <p className="text-xs text-[var(--color-text-secondary)] font-mono tracking-wider">Cargando...</p>
    </div>
  );
}
```
**Análisis de UX:**
El uso de un loader de pantalla completa bloquea al usuario y le impide asimilar visualmente la estructura de la aplicación.
*   *Alternativa Moderna:* Los **Skeleton Screens** (bloques grises animados en forma del bento grid de la app) preparan psicológicamente al usuario para lo que va a ver, reduciendo drásticamente la tasa de rebote percibida y transmitiendo una sensación de carga instantánea.

---

## 5. PLAN DE ACCIÓN RECOMENDADO (PASO A PASO)

A continuación, se detalla la hoja de ruta técnica para solucionar estos problemas, garantizando un portal de clientes robusto, seguro y altamente pulido.

### Paso 1: Blindar `/api/ai/chat` contra Abuso de Costos
**Recomendación:** No permitir que el frontend envíe texto libre ilimitado. En su lugar, el backend debe recibir un `projectId` y el `userMsg`, construir el prompt de forma interna y hermética, y validarlo.

*Implementación en el Backend:*
```typescript
// En server.ts (Reemplazar endpoint de chat actual)
app.post("/api/ai/chat", authenticateToken, async (req: any, res) => {
  const { projectId, message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Mensaje inválido" });
  }

  // 1. Validar que el cliente tenga acceso al proyecto solicitado
  const project = dbInstance.getProjects().find((p) => p.id === projectId);
  if (!project) return res.status(404).json({ error: "Proyecto no encontrado." });
  if (req.user.role !== "admin" && project.clientUserId !== req.user.id) {
    return res.status(403).json({ error: "Acceso denegado." });
  }

  // 2. Extraer métricas de forma segura en backend
  const approved = dbInstance.getTasks().filter(t => t.projectId === projectId && t.status === "approved").length;
  const pending = dbInstance.getTasks().filter(t => t.projectId === projectId && t.status === "pending").length;
  const pendingInvoicesCount = dbInstance.getInvoices().filter(i => i.projectId === projectId && i.status === "pending").length;

  // 3. Ensamblar prompt del lado del servidor de forma segura
  const context = `Contexto: Proyecto "${project.name}" al ${project.progress}% en fase "${project.currentPhase}". Entregables aprobados: ${approved}, pendientes: ${pending}. Facturas pendientes: ${pendingInvoicesCount}. Soporte: WhatsApp: +18299200544, correo: soporte@polariswebstudio.com.`;
  
  const systemPrompt = `Eres el asistente de Polaris Web Studio. ${context} El cliente pregunta: "${message}". Responde de forma amigable, directa, profesional y concisa (máximo 3 oraciones), exclusivamente sobre estos datos.`;

  try {
    const text = await askAI(systemPrompt);
    res.json({ text });
  } catch (e: any) {
    res.status(500).json({ error: "Error procesando IA." });
  }
});
```

### Paso 2: Implementar Selector de Proyecto para Clientes Multi-Proyecto
**Recomendación:** Modificar `ClientDashboard.tsx` para declarar un estado `activeClientProjectId` y renderizar un pequeño e intuitivo menú desplegable (Dropdown) en la barra de navegación lateral o en el panel principal que permita alternar si el cliente posee más de un proyecto activo.

*Implementación en Frontend:*
```tsx
// 1. Reemplazar la selección hardcodeada por un estado dinámico:
const [activeClientProjectId, setActiveClientProjectId] = useState<string | null>(null);

// 2. Sincronizar el estado con el primer proyecto disponible al cargar
useEffect(() => {
  if (data?.projects && data.projects.length > 0 && !activeClientProjectId) {
    setActiveClientProjectId(data.projects[0].id);
  }
}, [data, activeClientProjectId]);

// 3. Obtener el proyecto activo dinámicamente:
const clientProject = React.useMemo(() => {
  if (isAdmin) return null;
  if (!data?.projects || data.projects.length === 0) return null;
  return data.projects.find((p: any) => p.id === activeClientProjectId) || data.projects[0];
}, [data, activeClientProjectId, isAdmin]);
```

*Renderizar el Selector de Proyectos en el Sidebar (Solo si el cliente tiene más de un proyecto):*
```tsx
{!isAdmin && data?.projects && data.projects.length > 1 && (
  <div className="px-4 py-2 mb-4">
    <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-1">
      Proyecto Activo
    </label>
    <select
      value={activeClientProjectId || ""}
      onChange={(e) => setActiveClientProjectId(e.target.value)}
      className="glass-input w-full px-3 py-1.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
    >
      {data.projects.map((p: any) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  </div>
)}
```

### Paso 3: Persistir Historial de Chat en `localStorage`
**Recomendación:** Agregar un `useEffect` simple que guarde el historial de chat de Atlas AI en `localStorage` usando el `userId` como clave para aislar conversaciones entre cuentas en la misma máquina.

*Implementación en Frontend:*
```tsx
// Al cargar el componente
useEffect(() => {
  if (user?.id) {
    const saved = localStorage.getItem(`polaris_chat_${user.id}`);
    if (saved) {
      try {
        setChatMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Error cargando historial de chat", e);
      }
    }
  }
}, [user?.id]);

// Al cambiar los mensajes
useEffect(() => {
  if (user?.id && chatMessages.length > 0) {
    localStorage.setItem(`polaris_chat_${user.id}`, JSON.stringify(chatMessages));
  }
}, [chatMessages, user?.id]);
```

### Paso 4: Optimizar la DB a Escritura Asíncrona sin Bloqueo
**Recomendación:** Cambiar `fs.writeFileSync` por `fs.promises.writeFile` (asíncrono) para prevenir bloqueos de eventos en el backend.

*Implementación en `server-db.ts`:*
```typescript
private async save() {
  try {
    // Al realizarse en segundo plano de manera asíncrona, no bloquea el hilo principal
    await fs.promises.writeFile(this.dbPath, JSON.stringify(this.cache, null, 2), "utf-8");
  } catch (e) {
    console.error("[Db] Error saving database.", e);
  }
}
```
*Nota técnica:* Para evitar conflictos de escritura intermitente si múltiples escrituras asíncronas ocurren en ráfaga rápida, se puede encadenar una cola de promesas simple o un semáforo asíncrono para asegurar escrituras secuenciales ordenadas.

### Paso 5: Implementar Skeletons para Reemplazar el Spinner Bloqueante
**Recomendación:** Crear un componente `DashboardSkeleton.tsx` que simule la distribución visual de las tarjetas Bento (Cards) de la pestaña de Overview.

*Diseño de Esqueleto Estilizado:*
```tsx
function DashboardSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8 animate-pulse">
      {/* Skeleton Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-neutral-800 rounded" />
          <div className="h-4 w-32 bg-neutral-800 rounded" />
        </div>
        <div className="h-10 w-24 bg-neutral-800 rounded-full" />
      </div>

      {/* Skeleton Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-neutral-800 rounded-[var(--radius-bento)]" />
        <div className="h-32 bg-neutral-800 rounded-[var(--radius-bento)]" />
        <div className="h-32 bg-neutral-800 rounded-[var(--radius-bento)]" />
      </div>

      {/* Skeleton Big Panel */}
      <div className="h-96 bg-neutral-800 rounded-[var(--radius-bento)]" />
    </div>
  );
}
```
Reemplazar el spinner del dashboard principal (`ClientDashboard.tsx`) por este esqueleto para un salto de calidad masivo en experiencia de usuario.

---

## CONCLUSIÓN

El Portal de Clientes de Polaris es una pieza de software increíblemente estructurada con capas de seguridad robustas y una excelente UI visual basada en Bento. Al corregir la vulnerabilidad del Proxy AI y habilitar el selector de proyectos multi-proyecto, el sistema madurará para posicionarse como una solución SaaS de nivel corporativo para la gestión de proyectos de Polaris Web Studio.
