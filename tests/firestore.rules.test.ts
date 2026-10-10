import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, GeoPoint, getDoc, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";

const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const describeWithEmulator = enabled ? describe : describe.skip;
let env: RulesTestEnvironment;
const pandal = { name: "Test Puja", address: "Kolkata", locality: "Kolkata", location: new GeoPoint(22.57, 88.36), latitude: 22.57, longitude: 88.36, status: "published", createdBy: "admin-1", createdAt: new Date(), updatedAt: new Date() };

describeWithEmulator("pandal Firestore policy", () => {
  beforeAll(async () => { env = await initializeTestEnvironment({ projectId: "puja26-rules-test", firestore: { rules: readFileSync("firestore.rules", "utf8") } }); });
  afterAll(async () => { await env.cleanup(); });
  it("allows public reads of published pandals", async () => { await env.withSecurityRulesDisabled(async (context) => setDoc(doc(context.firestore(), "pandals", "public"), pandal)); await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), "pandals", "public"))); });
  it("rejects public pandal creation", async () => { await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), "pandals", "nope"), pandal)); });
  it("allows an admin to create a compliant pandal", async () => { const context = env.authenticatedContext("admin-1", { admin: true }); await assertSucceeds(setDoc(doc(context.firestore(), "pandals", "okay"), pandal)); });
});
