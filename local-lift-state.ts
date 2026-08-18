export type LocalLiftPhaseStatus = "completed" | "active" | "pending";

export interface LocalLiftPhase {
  name: string;
  status: LocalLiftPhaseStatus;
  detail?: string;
  [key: string]: unknown;
}

export interface LocalLiftProjectState {
  localLiftTier?: string;
  currentPhase?: string;
  progress?: number;
  phases?: LocalLiftPhase[];
  [key: string]: unknown;
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
    if (phase.name === "Entrega") return { ...phase, status: "completed" as const };
    if (!isAscenso && phase.name === "Preparando tu paquete") return { ...phase, status: "completed" as const };
    return phase;
  });

  if (!isAscenso) {
    return { currentPhase: "Entrega", progress: 100, phases: nextPhases };
  }

  const meetingCompleted = nextPhases.some((phase) => phase.name === "Agenda tu reunión" && phase.status === "completed");
  const implementationCompleted = nextPhases.some((phase) => phase.name === "Implementación asistida" && phase.status === "completed");

  if (implementationCompleted) {
    return { currentPhase: "Entrega", progress: 100, phases: nextPhases };
  }
  if (meetingCompleted) {
    return { currentPhase: "Implementación asistida", progress: 55, phases: nextPhases.map((phase) => phase.name === "Implementación asistida" ? { ...phase, status: "active" as const } : phase) };
  }
  return { currentPhase: "Agenda tu reunión", progress: 20, phases: nextPhases.map((phase) => phase.name === "Agenda tu reunión" ? { ...phase, status: "active" as const } : phase) };
}
