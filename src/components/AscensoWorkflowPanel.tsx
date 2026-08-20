import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Clock, FileText, Loader2, MessageCircle, Send, ShieldCheck } from "lucide-react";

interface WorkflowPanelProps {
  project: any;
  token: string;
  onChanged?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  package_ready: "Paquete generado",
  awaiting_connection: "Paquete recibido · listo para revisar",
  awaiting_client_review: "Paquete en preparación",
  preparing_package: "Preparando tu paquete",
  awaiting_package_approval: "Paquete listo para aprobar",
  package_approved: "Aprobación recibida · enviando PDFs",
  paused_no_response: "Pausado por falta de respuesta",
  changes_requested: "Solicitud recibida",
  revision_ready: "Revisión lista para aprobar",
  approved: "Versión aprobada · preparando cierre",
  pending_admin_review: "Aprobado · acompañamiento listo",
  publishing: "Preparando acompañamiento",
  implementation_completed: "Acompañamiento completado",
  closed: "Servicio cerrado",
};

const GUIDE_ASSET_BY_TITLE: Record<string, string> = {
  "Descripción del negocio": "es/annotated/01-editar-perfil.png",
  "Servicios y llamadas a la acción": "es/annotated/02-editar-servicios.png",
  "Publicaciones y novedades": "es/annotated/05-publicaciones.png",
  "Fotos del negocio": "es/annotated/06-fotos.png",
  "Lectura de reseñas y buenas prácticas": "es/annotated/15-rendimiento.png",
  "Respuestas a reseñas": "es/annotated/07-resenas.png",
  "Mensajes de seguimiento": "es/annotated/16-mensajeria.png",
  "Verificación final": "es/annotated/09-estado-pendiente.png",
};

const requestStatus: Record<string, string> = {
  submitted: "Recibida",
  in_progress: "En revisión",
  revision_ready: "Lista para revisar",
  approved: "Aprobada",
  changes_requested: "Aclaración enviada",
  closed: "Cerrada",
};

export default function AscensoWorkflowPanel({ project, token, onChanged }: WorkflowPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestText, setRequestText] = useState("");
  const [clarification, setClarification] = useState("");
  const [additionalRoundText, setAdditionalRoundText] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/portal/local-lift/workflow/${encodeURIComponent(project.id)}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo cargar el paquete Ascenso.");
      setData(result);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el flujo Ascenso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [project.id, token]);

  const workflow = data?.workflow;
  const activeRequest = useMemo(() => workflow?.requests?.find((item: any) => ["submitted", "in_progress", "revision_ready", "changes_requested"].includes(item.status)) || null, [workflow]);
  const packageData = data?.package;
  const guideSteps = Array.isArray(packageData?.implementationGuide) ? packageData.implementationGuide : [];
  const canRequest = !!workflow?.status && !!data?.packageSent && data?.canRequestNewRound && !activeRequest && !["closed", "paused_no_response", "package_approved"].includes(workflow.status);
  const canApproveInitial = !!data?.packageSent && workflow.status === "awaiting_package_approval" && !activeRequest;
  const quickGuide = (title: string) => {
    const step = guideSteps.find((item: any) => item.title === title || item.titleEn === title);
    if (!step?.quickStart) return null;
    const asset = GUIDE_ASSET_BY_TITLE[step.title] || GUIDE_ASSET_BY_TITLE[step.titleEn] || step.visualAsset;
    return <div className="space-y-3"><div className="rounded-lg border border-teal-500/20 bg-teal-500/[0.05] p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]"><p className="text-[10px] font-black uppercase tracking-widest text-teal-500">Cómo aplicar esta sección</p><p className="mt-1">{step.quickStart}</p></div>{asset && <figure className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]"><img src={`/ascenso-guide/${asset}`} alt={step.visualAlt || "Referencia visual del paso de implementación"} loading="lazy" decoding="async" className="block h-auto max-h-[360px] w-full object-contain bg-white" /><figcaption className="px-3 py-2 text-[10px] leading-relaxed text-[var(--color-text-tertiary)]">Referencia visual. La interfaz puede variar según la cuenta.</figcaption></figure>}</div>;
  };

  const mutate = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/portal/local-lift/workflow", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, projectId: project.id, ...extra }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo actualizar la revisión.");
      if (result.workflow) setData((previous: any) => ({ ...previous, workflow: result.workflow, roundsRemaining: Math.max(0, result.workflow.maxRounds - result.workflow.roundsUsed), canRequestNewRound: result.workflow.roundsUsed < result.workflow.maxRounds }));
      setRequestText("");
      setClarification("");
      setAdditionalRoundText("");
      setNotice(action === "submit_review_request" ? "Tu solicitud fue enviada." : action === "client_approve_revision" ? "Aprobaste esta revisión. Polaris recibirá la notificación." : action === "client_approve_initial_package" ? "Aprobaste el paquete. Te enviaremos los PDFs finales por correo." : "Tu aclaración fue enviada sin consumir una ronda nueva.");
      onChanged?.();
    } catch (e: any) {
      setError(e?.message || "No se pudo actualizar la revisión.");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <div className="rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] p-6 flex items-center gap-3 text-sm text-[var(--color-text-secondary)]"><Loader2 size={17} className="animate-spin text-[var(--color-primary-base)]" /> Cargando tu paquete Ascenso…</div>;
  if (error) return <div className="rounded-[var(--radius-bento)] border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">{error}<button type="button" onClick={() => void load()} className="ml-3 underline font-bold">Reintentar</button></div>;
  if (!workflow) return null;

  return (
    <section className="rounded-[var(--radius-bento)] border border-indigo-500/20 bg-indigo-500/[0.04] p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0"><ShieldCheck size={19} className="text-indigo-400" /></div>
          <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Acompañamiento Ascenso</p><h2 className="mt-1 text-lg font-display font-black text-[var(--color-text-primary)]">Revisa tu paquete y sigue la guía</h2><p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">Polaris preparó el contenido y la guía para que sepas qué hacer, dónde hacerlo y cómo avanzar paso a paso.</p></div>
        </div>
        <span className="shrink-0 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-300">{STATUS_LABEL[workflow.status] || workflow.status}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/40 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">Rondas usadas</p><p className="mt-1 text-2xl font-black text-[var(--color-text-primary)]">{workflow.roundsUsed} <span className="text-sm text-[var(--color-text-tertiary)]">de {workflow.maxRounds}</span></p></div>
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/40 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">Versión actual</p><p className="mt-1 text-2xl font-black text-[var(--color-text-primary)]">v{workflow.currentVersion}</p></div>
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/40 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">Restantes</p><p className="mt-1 text-2xl font-black text-[var(--color-primary-base)]">{Math.max(0, workflow.maxRounds - workflow.roundsUsed)}</p></div>
      </div>

      {packageData && (
        <div className="space-y-4">
          {packageData.rewrittenDescription && <article className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/30 p-4 sm:p-5 space-y-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Descripción preparada</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-secondary)]">{packageData.rewrittenDescription}</p></div>{quickGuide("Descripción del negocio")}</article>}
          {Array.isArray(packageData.services) && packageData.services.length > 0 && <article className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/30 p-4 sm:p-5 space-y-3"><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Servicios a destacar</p><div className="flex flex-wrap gap-2">{packageData.services.map((service: string) => <span key={service} className="rounded-full border border-[var(--color-border-subtle)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">{service}</span>)}</div>{quickGuide("Servicios y llamadas a la acción")}</article>}
          {Array.isArray(packageData.googlePosts) && packageData.googlePosts.length > 0 && <article className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/30 p-4 sm:p-5 space-y-3"><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">{packageData.googlePosts.length} publicaciones preparadas</p><p className="text-xs text-[var(--color-text-secondary)]">El paquete contiene los textos para revisar y aplicar cuando corresponda.</p>{quickGuide("Publicaciones y novedades")}</article>}
          {Array.isArray(packageData.reviewAnalysis?.recurringThemes) && <article className="rounded-xl border border-[var(--color-primary-base)]/20 bg-[var(--color-primary-base)]/[0.04] p-4 sm:p-5 space-y-3"><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Lectura de reseñas y buenas prácticas</p><p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">El análisis resume patrones de una muestra reciente y los convierte en prioridades para trabajar.</p>{quickGuide("Lectura de reseñas y buenas prácticas")}</article>}
          {Array.isArray(packageData.reviewReplies) && packageData.reviewReplies.length > 0 && <article className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/30 p-4 sm:p-5 space-y-3"><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Respuestas preparadas</p><p className="text-xs text-[var(--color-text-secondary)]">Revisa cada respuesta y personalízala con el contexto real antes de enviarla.</p>{quickGuide("Respuestas a reseñas")}</article>}
          {Array.isArray(packageData.whatsappMessages) && packageData.whatsappMessages.length > 0 && <article className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/30 p-4 sm:p-5 space-y-3"><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Mensajes de seguimiento</p><p className="text-xs text-[var(--color-text-secondary)]">Usa cada mensaje solo cuando el escenario corresponda y revisa sus datos variables.</p>{quickGuide("Mensajes de seguimiento")}</article>}

          <article className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/30 p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-primary-base)]/20 bg-[var(--color-primary-base)]/10"><FileText size={17} className="text-[var(--color-primary-base)]" /></div>
            <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Guía visual de implementación Ascenso</p><h3 className="mt-1 text-base font-display font-black text-[var(--color-text-primary)]">Consulta el documento completo por separado</h3><p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">Aquí encontrarás el detalle completo de cada proceso y sus referencias visuales. Las instrucciones breves de arriba sirven para avanzar en contexto; la guía independiente queda como referencia.</p></div>
          </div>

          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs leading-relaxed text-indigo-200"><strong>Cómo usar este documento:</strong> abre una sección, reúne lo que necesitas antes de empezar, sigue las instrucciones y registra tus dudas desde el portal. Los nombres y botones pueden variar según tu cuenta; si algo no aparece, detente y consúltalo con Polaris. Las rondas sirven para ajustar el material preparado; no significan que Polaris publique por ti.</div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold text-[var(--color-text-secondary)]"><span className="rounded-full bg-[var(--color-surface-highlight)] px-2 py-1">{guideSteps.length} secciones</span><span className="rounded-full bg-[var(--color-surface-highlight)] px-2 py-1">{packageData.googlePosts?.length || 0} publicaciones</span><span className="rounded-full bg-[var(--color-surface-highlight)] px-2 py-1">{packageData.reviewReplies?.length || 0} respuestas</span><span className="rounded-full bg-[var(--color-surface-highlight)] px-2 py-1">{packageData.services?.length || 0} servicios</span></div>

          <div className="space-y-3">
            {guideSteps.map((step: any, index: number) => (
              <details key={`${step.title}-${index}`} open={index === 0} className="group rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/40 p-4">
                <summary className="cursor-pointer list-none pr-5 text-sm font-black text-[var(--color-text-primary)] marker:hidden"><span className="mr-2 text-[var(--color-primary-base)]">{String(index + 1).padStart(2, "0")}</span>{step.title}<span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Ruta orientativa: {step.where}</span></summary>
                <div className="mt-4 space-y-4 border-t border-[var(--color-border-subtle)] pt-4">
                  <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{step.summary}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Antes de empezar</p><ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-[var(--color-text-secondary)]">{(step.beforeYouStart || []).map((item: string, itemIndex: number) => <li key={itemIndex}>{item}</li>)}</ul></div>
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Comprueba al final</p><ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-[var(--color-text-secondary)]">{(step.verify || []).map((item: string, itemIndex: number) => <li key={itemIndex}>{item}</li>)}</ul></div>
                  </div>
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Instrucciones</p><ol className="mt-2 list-decimal space-y-2 pl-5 text-xs leading-relaxed text-[var(--color-text-secondary)]">{(step.steps || []).map((item: string, itemIndex: number) => <li key={itemIndex} className="pl-1">{item}</li>)}</ol></div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Evita estos errores</p><ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-amber-100/80">{(step.avoid || []).map((item: string, itemIndex: number) => <li key={itemIndex}>{item}</li>)}</ul></div>
                  {index === guideSteps.length - 1 && (GUIDE_ASSET_BY_TITLE[step.title] || step.visualAsset) && <figure className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]"><img src={`/ascenso-guide/${GUIDE_ASSET_BY_TITLE[step.title] || step.visualAsset}`} alt={step.visualAlt || "Referencia visual del paso de implementación"} loading="lazy" decoding="async" className="block h-auto max-h-[360px] w-full object-contain bg-white" /><figcaption className="px-3 py-2 text-[10px] leading-relaxed text-[var(--color-text-tertiary)]">Referencia visual. La interfaz puede variar según la cuenta.</figcaption></figure>}
                </div>
              </details>
            ))}
          </div>
          </article>
        </div>
      )}

      {canApproveInitial && (
        <div className="rounded-xl border border-teal-500/25 bg-teal-500/5 p-4 space-y-3">
          <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10"><CheckCircle2 size={17} className="text-teal-400" /></div><div><p className="text-[10px] font-black uppercase tracking-widest text-teal-400">Paquete listo para aprobar</p><h3 className="mt-1 text-base font-display font-black text-[var(--color-text-primary)]">Revisa la versión preparada</h3><p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">Si todo está correcto, aprueba el paquete. Después recibirás por correo el PDF final y la guía visual de Ascenso.</p></div></div>
          <div className="flex flex-wrap gap-2"><button type="button" disabled={!!busy} onClick={() => void mutate("client_approve_initial_package")} className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-50"><CheckCircle2 size={14} /> Aprobar paquete y recibir PDFs</button><span className="self-center text-[10px] text-[var(--color-text-tertiary)]">También puedes solicitar una ronda antes de aprobar.</span></div>
        </div>
      )}

      {activeRequest && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Clock size={15} className="text-amber-400" /><h3 className="text-sm font-black text-[var(--color-text-primary)]">Ronda {activeRequest.round} de {activeRequest.maxRounds}</h3></div><span className="text-[10px] font-black uppercase tracking-wider text-amber-400">{requestStatus[activeRequest.status] || activeRequest.status}</span></div>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-text-secondary)]">{activeRequest.requestText}</p>
          {activeRequest.adminResponse && <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/50 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Revisión de Polaris</p><p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-text-secondary)]">{activeRequest.adminResponse}</p></div>}
          {activeRequest.status === "revision_ready" && (
            <div className="space-y-3 pt-2"><textarea value={clarification} onChange={(e) => setClarification(e.target.value)} rows={3} placeholder="Si necesitas aclarar algo de esta misma revisión, escríbelo aquí…" className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-xs outline-none focus:border-indigo-400" /><div className="flex flex-wrap gap-2"><button type="button" disabled={!!busy} onClick={() => void mutate("client_approve_revision", { requestId: activeRequest.id })} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><CheckCircle2 size={14} /> Aprobar esta versión</button><button type="button" disabled={!!busy || !clarification.trim()} onClick={() => void mutate("client_request_revision_changes", { requestId: activeRequest.id, text: clarification })} className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 px-4 py-2 text-xs font-black text-amber-300 disabled:opacity-50"><MessageCircle size={14} /> Pedir aclaración</button></div><p className="text-[10px] text-[var(--color-text-tertiary)]">Pedir una aclaración sobre esta misma revisión no descuenta una ronda nueva. Si aún quieres cambios, inicia la siguiente ronda antes de aprobar.</p>{workflow.roundsUsed < workflow.maxRounds && <div className="border-t border-[var(--color-border-subtle)] pt-3 space-y-2"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">¿Necesitas cambios adicionales?</p><textarea value={additionalRoundText} onChange={(e) => setAdditionalRoundText(e.target.value)} rows={3} placeholder="Agrupa aquí los cambios de una nueva ronda…" className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-xs outline-none focus:border-indigo-400" /><button type="button" disabled={!!busy || !additionalRoundText.trim()} onClick={() => void mutate("client_start_additional_round", { requestId: activeRequest.id, text: additionalRoundText })} className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/40 px-4 py-2 text-xs font-black text-indigo-300 disabled:opacity-50"><Send size={14} /> Iniciar ronda {workflow.roundsUsed + 1} de {workflow.maxRounds}</button></div>}</div>
          )}
        </div>
      )}

      {canRequest && (
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/30 p-4 space-y-3"><div className="flex items-center gap-2"><MessageCircle size={15} className="text-[var(--color-primary-base)]" /><h3 className="text-sm font-black text-[var(--color-text-primary)]">¿Quieres solicitar cambios?</h3></div><p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">Agrupa todos tus comentarios en una sola solicitud. Cada envío utiliza una ronda; las aclaraciones sobre una revisión ya entregada no consumen otra.</p><textarea value={requestText} onChange={(e) => setRequestText(e.target.value)} rows={5} maxLength={5000} placeholder="Ejemplo: cambia la descripción, ajusta el tono de la publicación 2 y modifica la respuesta a la reseña de María…" className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-xs outline-none focus:border-[var(--color-primary-base)]" /><div className="flex items-center justify-between gap-3"><span className="text-[10px] text-[var(--color-text-tertiary)]">{requestText.length}/5000</span><button type="button" disabled={!requestText.trim() || !!busy} onClick={() => void mutate("submit_review_request", { text: requestText })} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-base)] px-4 py-2 text-xs font-black text-white disabled:opacity-50"><Send size={14} /> Enviar solicitud · usar una ronda</button></div></div>
      )}

      {!canRequest && !activeRequest && workflow.roundsUsed >= workflow.maxRounds && workflow.status !== "closed" && <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-200">Has utilizado las {workflow.maxRounds} rondas incluidas. Puedes seguir consultando el paquete y su historial; cualquier cambio nuevo se cotiza como un servicio adicional.</div>}
      {workflow.status === "preparing_package" && <div className="rounded-xl border border-teal-500/25 bg-teal-500/5 p-4 text-xs leading-relaxed text-teal-200">Estamos preparando tu paquete. El plazo estimado de Ascenso es de cinco horas corridas desde el pago confirmado.</div>}
      {workflow.status === "awaiting_package_approval" && <div className="rounded-xl border border-teal-500/25 bg-teal-500/5 p-4 text-xs leading-relaxed text-teal-200">Tu paquete ya está disponible para revisión. Los PDFs finales se enviarán después de que apruebes la versión.</div>}
      {workflow.status === "package_approved" && <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4 text-xs leading-relaxed text-indigo-200">Aprobación recibida. Estamos enviando tus PDFs finales.</div>}
      {workflow.status === "paused_no_response" && <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-200">El servicio quedó pausado por falta de respuesta. El material preparado se conserva; contáctanos para reanudarlo.</div>}
      {workflow.status === "pending_admin_review" && <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4 text-xs leading-relaxed text-indigo-200">Aprobaste esta revisión. Polaris preparará la siguiente versión y te avisará cuando esté lista.</div>}
      {workflow.status === "implementation_completed" && <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-xs leading-relaxed text-emerald-200">El acompañamiento incluido ya fue completado. La guía y el historial quedan disponibles para consulta.</div>}
      {workflow.status === "closed" && <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/40 p-4 text-xs leading-relaxed text-[var(--color-text-secondary)]">Este servicio ya fue cerrado. Los cambios posteriores se cotizan por separado.</div>}
      {notice && <p className="text-xs font-bold text-emerald-400">{notice}</p>}
      {error && <p className="text-xs font-bold text-red-400">{error}</p>}

      <div className="space-y-2"><h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">Historial del servicio</h3>{(workflow.history || []).slice(-8).reverse().map((event: any) => <div key={event.id} className="flex items-start gap-2 text-[11px] text-[var(--color-text-tertiary)]"><Check size={12} className="mt-0.5 shrink-0 text-emerald-400" /><span>{new Date(event.at).toLocaleString("es-DO")} · {event.type.replaceAll("_", " ")}</span></div>)}</div>
    </section>
  );
}
