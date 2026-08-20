import type { DbProjectPhase } from "./server-db.js";

export type LocalLiftPhaseStatus = DbProjectPhase["status"];
export type LocalLiftPhase = DbProjectPhase;

export interface LocalLiftProjectState {
  localLiftTier?: string;
  localLiftPackageReadyAt?: string;
  localLiftContractStatus?: string;
  localLiftPackageApprovalStatus?: string;
  localLiftFinalDeliveryAt?: string;
  currentPhase?: string;
  progress?: number;
  phases?: LocalLiftPhase[];
}

export interface LocalLiftDeliveryTransition {
  currentPhase: string;
  progress: number;
  phases: LocalLiftPhase[];
}

export function transitionLocalLiftAfterPackageSent(project: LocalLiftProjectState): LocalLiftDeliveryTransition {
  const phases = Array.isArray(project.phases) ? project.phases : [];
  const isAscenso = project.localLiftTier === "ascenso";
  const nextPhases = phases.map((phase) => {
    const isLegacyAscensoGuide = isAscenso && phase.name === "Implementación asistida";
    if (isLegacyAscensoGuide) return { ...phase, name: "Acompañamiento guiado", detail: "Te mostramos paso a paso cómo aplicar los cambios y revisamos tus dudas durante la sesión." };
    if (phase.name === "Contrato" && (project as any).localLiftContractStatus === "signed") return { ...phase, status: "completed" as const };
    if (!isAscenso && phase.name === "Entrega") return { ...phase, status: "completed" as const };
    if (!isAscenso && phase.name === "Preparando tu paquete") return { ...phase, status: "completed" as const };
    return phase;
  });

  if (!isAscenso) {
    return { currentPhase: "Entrega", progress: 100, phases: nextPhases };
  }

  // Ascenso ya no depende de una reunión obligatoria. La entrega del paquete
  // activa una única etapa de aprobación; la entrega final se completa cuando
  // el cliente confirma la versión, incluso si no usa ninguna ronda.
  const approvalCompleted = nextPhases.some((phase) => (phase.name === "Revisión y aprobación" || phase.name === "Aprobación del paquete") && phase.status === "completed");
  const finalDeliveryCompleted = nextPhases.some((phase) => (phase.name === "Entrega final" || phase.name === "Entrega") && phase.status === "completed");
  if (finalDeliveryCompleted || (project as any).localLiftPackageApprovalStatus === "completed" || (project as any).localLiftFinalDeliveryAt) {
    return { currentPhase: "Entrega final", progress: 100, phases: nextPhases.map((phase) => (phase.name === "Entrega" ? { ...phase, name: "Entrega final", status: "completed" as const } : phase)) };
  }

  const preparingCompleted = nextPhases.some((phase) => phase.name === "Preparando tu paquete" && phase.status === "completed");
  if (preparingCompleted || (project as any).localLiftPackageReadyAt) {
    return { currentPhase: "Revisión y aprobación", progress: 66, phases: nextPhases.map((phase) => phase.name === "Revisión y aprobación" || phase.name === "Aprobación del paquete" ? { ...phase, name: "Revisión y aprobación", status: "active" as const } : phase) };
  }

  return { currentPhase: "Preparando tu paquete", progress: 33, phases: nextPhases.map((phase) => phase.name === "Preparando tu paquete" ? { ...phase, status: "active" as const } : phase) };
}
