import assert from "node:assert/strict";
import test from "node:test";
import { isFlowContactTopic, resolveFlowContactContext } from "./flowContact";

test("acepta únicamente los contextos comerciales permitidos de Flow", () => {
  assert.equal(isFlowContactTopic("polaris-flow"), true);
  assert.equal(isFlowContactTopic("office-flow"), true);
  assert.equal(isFlowContactTopic("local-lift"), false);
  assert.equal(isFlowContactTopic({ topic: "office-flow" }), false);
});

test("resuelve el contexto de Office Flow y rechaza consultas no autorizadas", () => {
  const officeFlow = resolveFlowContactContext("office-flow");

  assert.equal(officeFlow?.label, "Office Flow");
  assert.match(officeFlow?.headingEs ?? "", /diagnóstico/i);
  assert.equal(resolveFlowContactContext("<script>alert(1)</script>"), null);
  assert.equal(resolveFlowContactContext(null), null);
});
