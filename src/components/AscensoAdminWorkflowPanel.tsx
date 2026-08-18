import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, Send, ShieldCheck } from "lucide-react";

interface Props {
  leadId: string;
  token: string | null;
  packageSnapshot?: any;
  onWorkflowChange?: (workflow: any) => void;
}

const STATUS_LABEL: Record<string, string> = {
  awaiting_connection: "Esperando conexión de Google",
  awaiting_client_review: "Listo para revisar",
  changes_requested: "Solicitud pendiente",
  revision_ready: "Revisión enviada al cliente",
  pending_admin_review: "Cliente aprobó · listo para publicar",
  implementation_completed: "Implementación completada",
  closed: "Servicio cerrado",
};

export default function AscensoAdminWorkflowPanel({ leadId, token, packageSnapshot, onWorkflowChange }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/portal/local-lift/workflow/by-lead/${encodeURIComponent(leadId)}`, { headers: { Authorization: `Bearer ${token || ""}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo cargar el workflow.");
      setData(result);
      onWorkflowChange?.(result.workflow);
      setResponseDrafts((previous) => Object.fromEntries((result.workflow?.requests || []).map((request: any) => [request.id, previous[request.id] || request.adminResponse || ""])));
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el workflow.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [leadId, token]);

  const mutate = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/portal/local-lift/workflow", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` }, body: JSON.stringify({ action, projectId: data.projectId, ...extra }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo actualizar el workflow.");
      setData((previous: any) => ({ ...previous, workflow: result.workflow, roundsRemaining: Math.max(0, result.workflow.maxRounds - result.workflow.roundsUsed) }));
      onWorkflowChange?.(result.workflow);
      setNotice(action === "admin_send_revision" ? "La revisión se envió al cliente." : action === "admin_mark_published" ? "La implementación quedó marcada como completada." : "El servicio fue cerrado.");
    } catch (e: any) {
      setError(e?.message || "No se pudo actualizar el workflow.");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <section className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03] p-5 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"><Loader2 size={14} className="animate-spin text-indigo-400" /> Cargando rondas de Ascenso…</section>;
  if (error) return <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-xs text-red-300">{error}<button type="button" onClick={() => void load()} className="ml-2 underline font-bold">Reintentar</button></section>;
  if (!data?.workflow) return null;

  const workflow = data.workflow;
  const pendingRequests = workflow.requests.filter((request: any) => ["submitted", "in_progress", "changes_requested"].includes(request.status));

  return (
    <section className="rounded-xl border border-indigo-500/25 bg-indigo-500/[0.04] p-5 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center"><ShieldCheck size={17} className="text-indigo-400" /></div><div><p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Gestión Ascenso</p><h3 className="mt-1 text-base font-black text-[var(--color-text-primary)]">Revisión y publicación</h3><p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">Este panel es el centro de trabajo. Google solo recibe los cambios después de la aprobación.</p></div></div><span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-300">{STATUS_LABEL[workflow.status] || workflow.status}</span></div>
      <div className="grid grid-cols-3 gap-2"><div className="rounded-lg bg-[var(--color-surface-base)]/50 p-3"><p className="text-[9px] uppercase font-black tracking-wider text-[var(--color-text-tertiary)]">Rondas</p><p className="mt-1 text-lg font-black">{workflow.roundsUsed}/{workflow.maxRounds}</p></div><div className="rounded-lg bg-[var(--color-surface-base)]/50 p-3"><p className="text-[9px] uppercase font-black tracking-wider text-[var(--color-text-tertiary)]">Versión</p><p className="mt-1 text-lg font-black">v{workflow.currentVersion}</p></div><div className="rounded-lg bg-[var(--color-surface-base)]/50 p-3"><p className="text-[9px] uppercase font-black tracking-wider text-[var(--color-text-tertiary)]">Restantes</p><p className="mt-1 text-lg font-black text-indigo-300">{data.roundsRemaining}</p></div></div>

      <div className="space-y-3">
        {workflow.requests.length === 0 && <p className="rounded-lg border border-[var(--color-border-subtle)] p-3 text-xs text-[var(--color-text-tertiary)]">Todavía no hay solicitudes. Cuando el cliente envíe una ronda, aparecerá aquí.</p>}
        {workflow.requests.slice().reverse().map((request: any) => (
          <div key={request.id} className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/35 p-4 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Clock size={13} className="text-amber-400" /><span className="text-xs font-black">Ronda {request.round} de {request.maxRounds}</span></div><span className="text-[10px] uppercase font-black tracking-wider text-[var(--color-text-tertiary)]">{request.status}</span></div><p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-text-secondary)]">{request.requestText}</p>{["submitted", "in_progress", "changes_requested"].includes(request.status) && <div className="space-y-2"><textarea value={responseDrafts[request.id] || ""} onChange={(e) => setResponseDrafts((previous) => ({ ...previous, [request.id]: e.target.value }))} rows={4} placeholder="Escribe qué cambiaste y qué debe revisar el cliente…" className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs outline-none focus:border-indigo-400" /><button type="button" disabled={!responseDrafts[request.id]?.trim() || !!busy} onClick={() => void mutate("admin_send_revision", { requestId: request.id, adminResponse: responseDrafts[request.id], packageSnapshot })} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><Send size={13} /> Enviar revisión al cliente</button></div>}{request.adminResponse && <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Respuesta enviada</p><p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-text-secondary)]">{request.adminResponse}</p></div>}</div>
        ))}
      </div>

      {workflow.status === "pending_admin_review" && <div className="space-y-2"><p className="text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">Después de publicar las piezas aprobadas en la sección de Google, confirma aquí la implementación para avisar al cliente y cerrar el ciclo.</p><button type="button" disabled={!!busy} onClick={() => void mutate("admin_mark_published")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><CheckCircle2 size={15} /> Confirmar publicación completada</button></div>}
      {workflow.status === "implementation_completed" && <button type="button" disabled={!!busy} onClick={() => void mutate("admin_close_service")} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-subtle)] px-4 py-2.5 text-xs font-black text-[var(--color-text-secondary)] disabled:opacity-50">Cerrar servicio Ascenso</button>}
      {pendingRequests.length === 0 && workflow.roundsUsed >= workflow.maxRounds && workflow.status !== "closed" && <p className="text-[11px] text-amber-300">El cliente agotó sus rondas incluidas. Las aclaraciones sobre una revisión ya entregada no generan otra ronda.</p>}
      {notice && <p className="text-xs font-bold text-emerald-400">{notice}</p>}
      {error && <p className="text-xs font-bold text-red-400">{error}</p>}
    </section>
  );
}
