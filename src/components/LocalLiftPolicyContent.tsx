import type { ReactNode } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { T } from "../context/LanguageContext";
import { LOCAL_LIFT_POLICY_SECTIONS } from "../data/localLiftPolicies";

function PolicySection({ title, children, compact }: { title: ReactNode; children: ReactNode; compact?: boolean }) {
  return (
    <section className="space-y-3">
      <h2 className={`${compact ? "text-lg" : "text-xl md:text-2xl"} font-display font-bold tracking-tight text-[var(--color-text-primary)]`}>{title}</h2>
      <div className={`${compact ? "text-sm" : "text-sm md:text-base"} space-y-3 leading-relaxed text-[var(--color-text-secondary)]`}>{children}</div>
    </section>
  );
}

export default function LocalLiftPolicyContent({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-8" : "space-y-12"}>
      {LOCAL_LIFT_POLICY_SECTIONS.map((section) => (
        <PolicySection
          key={section.id}
          compact={compact}
          title={<T en={section.title.en}>{section.title.es}</T>}
        >
          {section.items && (
            <div className={`${section.tone === "teal" ? "border-[#16C8C1]/25 bg-[#16C8C1]/[0.05]" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]"} rounded-2xl border ${compact ? "p-4" : "p-5 md:p-6"}`}>
              <ul className="grid gap-3 text-sm text-[var(--color-text-secondary)] md:grid-cols-2">
                {section.items.map((item) => (
                  <li key={item.es} className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#16C8C1]" />
                    <T en={item.en}>{item.es}</T>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {section.paragraphs.map((paragraph, index) => (
            <p key={`${section.id}-paragraph-${index}`}><T en={paragraph.en}>{paragraph.es}</T></p>
          ))}
          {section.support && (
            <a href="https://wa.me/18299200544" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#16C8C1] px-4 py-2.5 text-xs font-bold text-[#111936] transition-opacity hover:opacity-90">
              <MessageCircle size={15} />
              <T en="Contact Local Lift support">Contactar soporte Local Lift</T>
            </a>
          )}
        </PolicySection>
      ))}
    </div>
  );
}
