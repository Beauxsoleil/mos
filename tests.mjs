import fs from "node:fs/promises";
import vm from "node:vm";

const catalog = JSON.parse(await fs.readFile(new URL("./data/mos.json", import.meta.url), "utf8"));
if (catalog.records.length !== 152) throw new Error(`Expected 152 records, found ${catalog.records.length}`);
if (new Set(catalog.records.map(record => record.mos)).size !== 152) throw new Error("MOS codes must be unique");
for (const record of catalog.records) {
  for (const key of ["mos", "title", "category", "description", "requirements", "idaho_availability"]) {
    if (!record[key]) throw new Error(`${record.mos || "unknown"} missing ${key}`);
  }
}

const source = await fs.readFile(new URL("./app.js", import.meta.url), "utf8");
new vm.Script(source, {filename: "app.js"});
const sandbox = vm.createContext({
  localStorage: {getItem: () => null, setItem: () => {}, removeItem: () => {}},
  URL,
});
vm.runInContext(source.replace(/\ninit\(\);\s*$/, ""), sandbox, {filename: "app.js"});
const scoreReason = vm.runInContext(`(() => {
  const result = evaluateLineRule("GM>=88", {GM:84}, false, "");
  return {status: result.status, gap: result.gap, explanation: explainCriterion({...result, kind:"Line score"})};
})()`, sandbox);
if (scoreReason.status !== "fail" || scoreReason.gap !== 4 || !scoreReason.explanation.includes("4 points short")) throw new Error("Line-score gap explanation is incorrect");
const studyAdvice = vm.runInContext(`studyAdviceFor("GT", 6)`, sandbox);
if (!studyAdvice.includes("Word Knowledge") || !studyAdvice.includes("Arithmetic Reasoning")) throw new Error("Study guidance does not name GT subtests");
const waiverStatus = vm.runInContext(`evaluateLineRule("GM>=88", {GM:85}, true, "").status`, sandbox);
if (waiverStatus !== "waiver") throw new Error("Expected modeled non-GT waiver scenario");
const gtWaiverStatus = vm.runInContext(`evaluateLineRule("GT>=110", {GT:107}, true, "").status`, sandbox);
if (gtWaiverStatus !== "fail") throw new Error("GT must not be modeled as a line-score waiver");
const pulhesReason = vm.runInContext(`(() => {
  const result = evaluatePulhes("P=2, U=2, L=2, H=2, E=2, S=2", {P:1,U:1,L:3,H:1,E:1,S:1});
  return explainCriterion({...result, kind:"PULHES"});
})()`, sandbox);
if (!pulhesReason.includes("L is 3; maximum 2")) throw new Error("PULHES blocker explanation is incorrect");
const html = await fs.readFile(new URL("./index.html", import.meta.url), "utf8");
for (const required of ["skip-link", "eligibility-form", "results-list", "mos-dialog", "mobile-nav"]) {
  if (!html.includes(required)) throw new Error(`index.html missing ${required}`);
}
for (const required of ["canonical", "og:image", "application/ld+json", "status-message", "error-colorVision"]) {
  if (!html.includes(required)) throw new Error(`index.html missing metadata or accessibility hook: ${required}`);
}
for (const required of ["Why you’re not eligible yet", "explainCriterion", "nextStepFor", "safeHttpUrl"]) {
  if (!source.includes(required)) throw new Error(`app.js missing explained-result behavior: ${required}`);
}
for (const path of ["404.html", "favicon.svg", "methodology.html", "robots.txt", "sitemap.xml", "llms.txt", "social-card.jpg"]) {
  const stat = await fs.stat(new URL(`./${path}`, import.meta.url));
  if (!stat.isFile() || stat.size === 0) throw new Error(`${path} is missing or empty`);
}
JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
console.log(`Validated ${catalog.records.length} MOS records, explained-result behavior, metadata, and static assets.`);
