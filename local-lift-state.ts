import type { DbProjectPhase } from "./server-db.js";

export type LocalLiftPhaseStatus = DbProjectPhase["status"];
export type LocalLiftPhase = DbProjectPhase;

export interface LocalLiftProjectState {
  localLiftTier?: string;
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
    if (phase.name === "Entrega") return { ...phase, status: "completed" as const };
    if (!isAscenso && phase.name === "Preparando tu paquete") return { ...phase, status: "completed" as const };
    return phase;
  });

  if (!isAscenso) {
    return { currentPhase: "Entrega", progress: 100, phases: nextPhases };
  }

  const meetingCompleted = nextPhases.some((phase) => phase.name === "Agenda tu reunión" && phase.status === "completed");
  const accompanimentCompleted = nextPhases.some((phase) => (phase.name === "Acompañamiento guiado" || phase.name === "Implementación asistida") && phase.status === "completed");

  if (accompanimentCompleted) {
    return { currentPhase: "Entrega", progress: 100, phases: nextPhases };
  }
  if (meetingCompleted) {
    return { currentPhase: "Acompañamiento guiado", progress: 55, phases: nextPhases.map((phase) => phase.name === "Acompañamiento guiado" || phase.name === "Implementación asistida" ? { ...phase, name: "Acompañamiento guiado", status: "active" as const } : phase) };
  }
  return { currentPhase: "Agenda tu reunión", progress: 20, phases: nextPhases.map((phase) => phase.name === "Agenda tu reunión" ? { ...phase, status: "active" as const } : phase) };
}
