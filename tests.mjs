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
const html = await fs.readFile(new URL("./index.html", import.meta.url), "utf8");
for (const required of ["skip-link", "eligibility-form", "results-list", "mos-dialog", "mobile-nav"]) {
  if (!html.includes(required)) throw new Error(`index.html missing ${required}`);
}
console.log(`Validated ${catalog.records.length} MOS records and static application syntax.`);
