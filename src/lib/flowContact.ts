export type FlowContactTopic = "polaris-flow" | "office-flow";

export interface FlowContactContext {
  topic: FlowContactTopic;
  label: string;
  headingEs: string;
  headingEn: string;
  descriptionEs: string;
  descriptionEn: string;
  messagePlaceholderEs: string;
  messagePlaceholderEn: string;
}

const FLOW_CONTACT_CONTEXT: Record<FlowContactTopic, FlowContactContext> = {
  "polaris-flow": {
    topic: "polaris-flow",
    label: "Polaris Flow",
    headingEs: "Hablemos de tu operación",
    headingEn: "Let’s talk about your operation",
    descriptionEs: "Cuéntanos dónde se pierde el seguimiento. Revisaremos el recorrido y definiremos si Polaris Flow es el siguiente paso adecuado.",
    descriptionEn: "Tell us where follow-through gets lost. We will review the journey and determine whether Polaris Flow is the right next step.",
    messagePlaceholderEs: "Cuéntanos cómo reciben, organizan, preparan y confirman el trabajo hoy…",
    messagePlaceholderEn: "Tell us how your team receives, organizes, prepares and confirms work today…",
  },
  "office-flow": {
    topic: "office-flow",
    label: "Office Flow",
    headingEs: "Solicita tu diagnóstico de Office Flow",
    headingEn: "Request your Office Flow diagnostic",
    descriptionEs: "Cuéntanos cómo reciben leads, preparan propuestas y dan seguimiento. La primera conversación sirve para mapear un flujo claro, no para enviarte una solución automática.",
    descriptionEn: "Tell us how your team receives leads, prepares proposals and follows up. The first conversation maps a clear workflow; it does not send an automatic solution.",
    messagePlaceholderEs: "Ejemplo: los leads llegan por distintos canales y necesitamos revisar cada propuesta antes de enviarla…",
    messagePlaceholderEn: "Example: leads arrive through different channels and we need to review each proposal before it is sent…",
  },
};

export function resolveFlowContactContext(rawTopic: string | null | undefined): FlowContactContext | null {
  if (rawTopic === "polaris-flow" || rawTopic === "office-flow") {
    return FLOW_CONTACT_CONTEXT[rawTopic];
  }
  return null;
}

export function isFlowContactTopic(rawTopic: unknown): rawTopic is FlowContactTopic {
  return rawTopic === "polaris-flow" || rawTopic === "office-flow";
}
