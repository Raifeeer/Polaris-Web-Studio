import { jsPDF } from "jspdf";
import {
  LOCAL_LIFT_POLICY_INTRO,
  LOCAL_LIFT_POLICY_LAST_UPDATED,
  LOCAL_LIFT_POLICY_SECTIONS,
  type LocalLiftLocale,
} from "../data/localLiftPolicies";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_SIZE = 9.5;
const BODY_LEADING = 4.8;

function addFooter(doc: jsPDF, locale: LocalLiftLocale) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(220, 226, 232);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, PAGE_HEIGHT - 16, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Polaris Web Studio · Local Lift", MARGIN, PAGE_HEIGHT - 10);
    doc.text(`${locale === "es" ? "Página" : "Page"} ${page} / ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: "right" });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= PAGE_HEIGHT - 24) return y;
  doc.addPage();
  return MARGIN;
}

function addParagraph(doc: jsPDF, text: string, y: number): number {
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
  y = ensureSpace(doc, y, lines.length * BODY_LEADING + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_SIZE);
  doc.setTextColor(55, 65, 81);
  doc.text(lines, MARGIN, y);
  return y + lines.length * BODY_LEADING + 5;
}

export function downloadLocalLiftPoliciesPdf(locale: LocalLiftLocale = "es") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const title = locale === "es" ? "Condiciones de Local Lift" : "Local Lift policies";
  const subtitle = locale === "es" ? "Alcance claro. Implementación guiada. Soporte definido." : "Clear scope. Guided implementation. Defined support.";
  const updated = locale === "es" ? `Última actualización: ${LOCAL_LIFT_POLICY_LAST_UPDATED}` : `Last updated: August 20, 2026`;
  let y = MARGIN;

  doc.setFillColor(22, 200, 193);
  doc.rect(0, 0, PAGE_WIDTH, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(22, 200, 193);
  doc.text("POLARIS LOCAL LIFT", MARGIN, y + 5);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(17, 25, 54);
  doc.text(title, MARGIN, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, MARGIN, y);
  y += 7;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(updated, MARGIN, y);
  y += 13;

  y = addParagraph(doc, LOCAL_LIFT_POLICY_INTRO[locale], y);
  y += 4;

  for (const section of LOCAL_LIFT_POLICY_SECTIONS) {
    const sectionTitle = section.title[locale];
    const titleLines = doc.splitTextToSize(sectionTitle, CONTENT_WIDTH) as string[];
    y = ensureSpace(doc, y, titleLines.length * 6 + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(17, 25, 54);
    doc.text(titleLines, MARGIN, y);
    y += titleLines.length * 6 + 4;

    if (section.items?.length) {
      for (const item of section.items) {
        const itemLines = doc.splitTextToSize(`• ${item[locale]}`, CONTENT_WIDTH - 4) as string[];
        y = ensureSpace(doc, y, itemLines.length * BODY_LEADING + 2);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(BODY_SIZE);
        doc.setTextColor(55, 65, 81);
        doc.text(itemLines, MARGIN + 2, y);
        y += itemLines.length * BODY_LEADING + 1.5;
      }
      y += 3;
    }

    for (const paragraph of section.paragraphs) {
      y = addParagraph(doc, paragraph[locale], y);
    }
    y += 4;
  }

  addFooter(doc, locale);
  doc.save(`Condiciones-Local-Lift-${locale === "es" ? "ES" : "EN"}.pdf`);
}
