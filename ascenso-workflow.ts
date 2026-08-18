import type { DbAscensoReviewRequest, DbAscensoWorkflow } from "./server-db.js";

export const ASCENSO_MAX_ROUNDS = 3;

export function createAscensoWorkflow(status: DbAscensoWorkflow["status"] = "awaiting_connection"): DbAscensoWorkflow {
  return {
    status,
    maxRounds: ASCENSO_MAX_ROUNDS,
    roundsUsed: 0,
    packageVersion: 1,
    currentVersion: 1,
    history: [{ id: `ascenso-event-${Date.now()}`, type: "workflow_created", actor: "system", at: new Date().toISOString(), version: 1 }],
    requests: [],
  };
}

export function ensureAscensoWorkflow(value?: Partial<DbAscensoWorkflow> | null, fallbackStatus: DbAscensoWorkflow["status"] = "awaiting_connection"): DbAscensoWorkflow {
  const base = createAscensoWorkflow(fallbackStatus);
  if (!value) return base;
  return {
    ...base,
    ...value,
    maxRounds: Math.max(1, Math.min(3, Number(value.maxRounds || ASCENSO_MAX_ROUNDS))),
    roundsUsed: Math.max(0, Math.min(3, Number(value.roundsUsed || 0))),
    packageVersion: Math.max(1, Number(value.packageVersion || 1)),
    currentVersion: Math.max(1, Number(value.currentVersion || 1)),
    history: Array.isArray(value.history) ? value.history : base.history,
    requests: Array.isArray(value.requests) ? value.requests : [],
  };
}

export function canStartNewRound(workflow: DbAscensoWorkflow): boolean {
  return workflow.status === "awaiting_client_review" && workflow.roundsUsed < workflow.maxRounds && !workflow.requests.some((r) => ["submitted", "in_progress", "revision_ready", "changes_requested"].includes(r.status));
}

export function hasOpenRevision(workflow: DbAscensoWorkflow): boolean {
  return workflow.requests.some((r) => ["submitted", "in_progress", "revision_ready"].includes(r.status));
}

export function startClientRound(workflow: DbAscensoWorkflow, requestText: string, now = new Date().toISOString()): { workflow: DbAscensoWorkflow; request: DbAscensoReviewRequest } {
  if (!requestText.trim()) throw new Error("La solicitud no puede estar vacía.");
  if (requestText.length > 5000) throw new Error("La solicitud es demasiado larga.");
  if (!canStartNewRound(workflow)) throw new Error("No tienes nuevas rondas disponibles o ya existe una revisión en curso.");
  const round = workflow.roundsUsed + 1;
  const id = `ascenso-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const request: DbAscensoReviewRequest = { id, round, maxRounds: workflow.maxRounds, status: "submitted", requestText: requestText.trim(), createdAt: now, updatedAt: now };
  return {
    request,
    workflow: {
      ...workflow,
      status: "changes_requested",
      roundsUsed: round,
      activeRequestId: id,
      lastClientActionAt: now,
      requests: [...workflow.requests, request],
      history: [...workflow.history, { id: `${id}-event`, type: "client_round_submitted", actor: "client", at: now, round, version: workflow.currentVersion }],
    },
  };
}

export function markAdminRevisionReady(workflow: DbAscensoWorkflow, requestId: string, adminResponse: string, now = new Date().toISOString()): DbAscensoWorkflow {
  if (!adminResponse.trim()) throw new Error("La respuesta de Polaris no puede estar vacía.");
  const request = workflow.requests.find((r) => r.id === requestId);
  if (!request) throw new Error("La solicitud no existe.");
  if (!["submitted", "in_progress", "changes_requested"].includes(request.status)) throw new Error("Esta solicitud no está pendiente de trabajo.");
  const version = workflow.currentVersion + 1;
  return {
    ...workflow,
    status: "revision_ready",
    currentVersion: version,
    activeRequestId: requestId,
    requests: workflow.requests.map((r) => r.id === requestId ? { ...r, status: "revision_ready", adminResponse: adminResponse.trim(), adminVersion: version, updatedAt: now } : r),
    history: [...workflow.history, { id: `${requestId}-revision-${version}`, type: "admin_revision_ready", actor: "admin", at: now, round: request.round, version }],
  };
}

export function clientApproveRevision(workflow: DbAscensoWorkflow, requestId: string, now = new Date().toISOString()): DbAscensoWorkflow {
  const request = workflow.requests.find((r) => r.id === requestId);
  if (!request || request.status !== "revision_ready") throw new Error("La revisión no está lista para aprobar.");
  return {
    ...workflow,
    status: "pending_admin_review",
    approvedAt: now,
    requests: workflow.requests.map((r) => r.id === requestId ? { ...r, status: "approved", approvedAt: now, updatedAt: now } : r),
    history: [...workflow.history, { id: `${requestId}-approved`, type: "client_approved_revision", actor: "client", at: now, round: request.round, version: request.adminVersion }],
  };
}

export function startAdditionalRound(workflow: DbAscensoWorkflow, requestId: string, requestText: string, now = new Date().toISOString()): { workflow: DbAscensoWorkflow; request: DbAscensoReviewRequest } {
  if (!requestText.trim()) throw new Error("La solicitud no puede estar vacía.");
  if (requestText.length > 5000) throw new Error("La solicitud es demasiado larga.");
  if (workflow.roundsUsed >= workflow.maxRounds) throw new Error("No tienes nuevas rondas disponibles.");
  const previous = workflow.requests.find((r) => r.id === requestId);
  if (!previous || previous.status !== "revision_ready") throw new Error("Primero debes recibir una revisión antes de iniciar otra ronda.");
  const round = workflow.roundsUsed + 1;
  const id = `ascenso-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const request: DbAscensoReviewRequest = { id, round, maxRounds: workflow.maxRounds, status: "submitted", requestText: requestText.trim(), createdAt: now, updatedAt: now };
  return {
    request,
    workflow: {
      ...workflow,
      status: "changes_requested",
      roundsUsed: round,
      activeRequestId: id,
      lastClientActionAt: now,
      requests: workflow.requests.map((r) => r.id === requestId ? { ...r, status: "closed", closedAt: now, updatedAt: now } : r).concat(request),
      history: [...workflow.history, { id: `${id}-event`, type: "client_additional_round_submitted", actor: "client", at: now, round, version: workflow.currentVersion }],
    },
  };
}

export function clientRequestChangesOnRevision(workflow: DbAscensoWorkflow, requestId: string, note: string, now = new Date().toISOString()): DbAscensoWorkflow {
  if (!note.trim()) throw new Error("La aclaración no puede estar vacía.");
  const request = workflow.requests.find((r) => r.id === requestId);
  if (!request || request.status !== "revision_ready") throw new Error("La revisión no está disponible para solicitar cambios.");
  return {
    ...workflow,
    status: "changes_requested",
    activeRequestId: requestId,
    lastClientActionAt: now,
    requests: workflow.requests.map((r) => r.id === requestId ? { ...r, status: "changes_requested", requestText: `${r.requestText}\n\nAclaración del cliente:\n${note.trim()}`, updatedAt: now } : r),
    history: [...workflow.history, { id: `${requestId}-clarification-${Date.now()}`, type: "client_requested_clarification", actor: "client", at: now, round: request.round, version: workflow.currentVersion }],
  };
}

export function markImplementationCompleted(workflow: DbAscensoWorkflow, requestId: string | undefined, now = new Date().toISOString()): DbAscensoWorkflow {
  return {
    ...workflow,
    status: "implementation_completed",
    publishedAt: now,
    activeRequestId: undefined,
    requests: workflow.requests.map((r) => requestId && r.id === requestId ? { ...r, status: "closed", closedAt: now, updatedAt: now } : r),
    history: [...workflow.history, { id: `ascenso-published-${Date.now()}`, type: "implementation_completed", actor: "admin", at: now, version: workflow.currentVersion }],
  };
}
