"use strict";

const LINE_SCORES = ["GT", "GM", "EL", "CL", "MM", "SC", "CO", "FA", "OF", "ST"];
const PULHES = {
  P: "Physical capacity",
  U: "Upper extremities",
  L: "Lower extremities",
  H: "Hearing",
  E: "Eyes",
  S: "Psychiatric",
};

function readSavedMos() {
  try {
    const stored = JSON.parse(localStorage.getItem("idahoMosSaved") || "[]");
    return new Set(Array.isArray(stored) ? stored.filter(value => typeof value === "string") : []);
  } catch {
    return new Set();
  }
}

const STORAGE_DRAFT = "idahoMosDraft";

function readDraft() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_DRAFT) || "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function restoreDraft() {
  const draft = readDraft();
  const form = $("#eligibility-form");
  if (!form || !draft || typeof draft !== "object") return;
  Object.entries(draft).forEach(([name, value]) => {
    if (typeof value !== "string" || value === "") return;
    const field = form.elements[name];
    if (!field) return;
    if (field.type === "number") {
      const number = Number(value);
      if (Number.isInteger(number) && number >= 0 && number <= 200) field.value = String(number);
    } else if ("value" in field) {
      field.value = value;
    }
  });
}

function saveDraft(event) {
  const form = $("#eligibility-form");
  if (!form) return;
  const draft = {};
  new FormData(form).forEach((value, key) => {
    if (value) draft[key] = String(value);
  });
  try {
    localStorage.setItem(STORAGE_DRAFT, JSON.stringify(draft));
  } catch {
    /* Local storage is optional. */
  }
}

let draftSaveTimer = null;
let careerRenderTimer = null;
let resultRenderTimer = null;

function clearDraft() {
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = null;
  }
  try {
    localStorage.removeItem(STORAGE_DRAFT);
  } catch {
    /* Local storage is optional. */
  }
}

const TOTAL_FORM_FIELDS = LINE_SCORES.length + Object.keys(PULHES).length + 6;

function updateFormCompletion() {
  const form = $("#eligibility-form");
  if (!form) return;
  const data = new FormData(form);
  let complete = 0;
  LINE_SCORES.forEach(score => {
    if (data.get(score) !== "") complete += 1;
  });
  Object.keys(PULHES).forEach(code => {
    if (data.get(`pulhes${code}`)) complete += 1;
  });
  ["colorVision", "citizenship", "driversLicense", "clearanceEligible", "splitTrainingOption", "lineScoreWaiverRequested"].forEach(field => {
    if (data.get(field)) complete += 1;
  });
  const percent = Math.round(complete / TOTAL_FORM_FIELDS * 100);
  const countEl = $("#completion-count");
  const bar = $("#completion-bar");
  const pct = $("#completion-percent");
  const line = $(".form-progress-line");
  if (countEl) countEl.textContent = `${complete} of ${TOTAL_FORM_FIELDS} fields complete`;
  if (bar) {
    bar.max = TOTAL_FORM_FIELDS;
    bar.value = complete;
  }
  if (pct) pct.textContent = `${percent}%`;
  if (line) line.style.inset = `0 ${100 - percent}% 0 0`;
  form.classList.toggle("form-complete", complete === TOTAL_FORM_FIELDS);
}

function handleFormInput() {
  updateFormCompletion();
  if (draftSaveTimer) clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(() => {
    draftSaveTimer = null;
    saveDraft();
  }, 300);
}

const state = {
  catalog: [],
  categories: [],
  evaluation: [],
  catalogPromise: null,
  saved: readSavedMos(),
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));

async function init() {
  buildFormFields();
  restoreDraft();
  updateFormCompletion();
  bindEvents();
  route();
}

async function ensureCatalog() {
  if (state.catalog.length) return state.catalog;
  if (state.catalogPromise) return state.catalogPromise;
  state.catalogPromise = (async () => {
  try {
    const response = await fetch("./data/mos.json");
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    const data = await response.json();
    state.catalog = data.records;
    state.categories = [...new Set(state.catalog.map(record => record.category))].sort();
    populateCategoryFilters();
    return state.catalog;
  } catch (error) {
    console.error(error);
    $("#career-list").innerHTML = `<div class="empty-state"><h2>Catalog unavailable</h2><p>Reload the page or open the raw MOS catalog from the repository.</p></div>`;
    announce("The MOS catalog could not be loaded.");
    throw error;
  }
  })();
  return state.catalogPromise;
}

function buildFormFields() {
  $("#line-score-grid").innerHTML = LINE_SCORES.map(score => `
    <label for="score-${score}">${score}
      <input id="score-${score}" name="${score}" type="number" inputmode="numeric" min="0" max="200" step="1" autocomplete="off" required aria-describedby="error-${score}">
      <span class="field-error" id="error-${score}"></span>
    </label>`).join("");
  $("#pulhes-grid").innerHTML = Object.entries(PULHES).map(([code, label]) => `
    <label for="pulhes-${code}">${code}<small>${label}</small>
      <select id="pulhes-${code}" name="pulhes${code}" required aria-describedby="error-pulhes-${code}">
        <option value="">Select</option><option value="unknown">Not yet rated</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
      </select><span class="field-error" id="error-pulhes-${code}"></span>
    </label>`).join("");
}

function bindEvents() {
  window.addEventListener("hashchange", route);
  $$('[data-route]').forEach(link => link.addEventListener("click", () => setTimeout(route)));
  $$('[data-route-button]').forEach(button => button.addEventListener("click", () => navigate(button.dataset.routeButton)));
  $("#eligibility-form").addEventListener("submit", handleEvaluation);
  $("#eligibility-form").addEventListener("input", handleFormInput);
  $("#clear-form").addEventListener("click", clearForm);
  $("#side-evaluate").addEventListener("click", () => {
    const form = $("#eligibility-form");
    if (form.requestSubmit) form.requestSubmit();
    else form.dispatchEvent(new Event("submit", {bubbles: true, cancelable: true}));
  });
  $("#career-search").addEventListener("input", scheduleCareersRender);
  $("#career-category").addEventListener("change", scheduleCareersRender);
  $("#career-availability").addEventListener("change", scheduleCareersRender);
  $("#career-sort").addEventListener("change", scheduleCareersRender);
  $("#clear-career-filters").addEventListener("click", clearCareerFilters);
  $("#result-search").addEventListener("input", scheduleResultsRender);
  $("#result-category").addEventListener("change", scheduleResultsRender);
  $("#result-status").addEventListener("change", scheduleResultsRender);
  $("#clear-result-filters").addEventListener("click", clearResultFilters);
  document.addEventListener("click", handleDelegatedClick);
  $("#mos-dialog .dialog-close").addEventListener("click", () => $("#mos-dialog").close());
  $("#mos-dialog").addEventListener("click", event => {
    if (event.target === $("#mos-dialog")) $("#mos-dialog").close();
  });
}

async function route() {
  const routeName = location.hash.replace("#", "") || "home";
  const allowed = ["home", "eligibility", "results", "careers", "saved", "recruiter"];
  const target = allowed.includes(routeName) ? routeName : "home";
  $$('[data-view]').forEach(view => view.hidden = view.dataset.view !== target);
  $$('[data-route]').forEach(link => {
    const active = link.dataset.route === target || (target === "results" && link.dataset.route === "eligibility");
    if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
  if (["eligibility", "results", "careers", "saved"].includes(target)) {
    try { await ensureCatalog(); } catch { /* The page already shows a useful error. */ }
  }
  if (target === "careers") renderCareers();
  if (target === "results") renderResults();
  if (target === "saved") renderSaved();
  $("#main").focus({preventScroll: true});
  window.scrollTo({top: 0, behavior: "auto"});
}

function navigate(view) {
  location.hash = view;
}

function populateCategoryFilters() {
  for (const id of ["career-category", "result-category"]) {
    const select = $(`#${id}`);
    state.categories.forEach(category => select.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`));
  }
}

async function handleEvaluation(event) {
  event.preventDefault();
  clearValidationErrors();
  const form = new FormData(event.currentTarget);
  const errors = [];
  const input = {lineScores: {}, pulhes: {}};

  for (const score of LINE_SCORES) {
    const raw = form.get(score);
    const value = Number(raw);
    if (raw === "" || !Number.isInteger(value) || value < 0 || value > 200) {
      errors.push({field: `score-${score}`, message: `${score} must be a whole number from 0 to 200.`});
    } else input.lineScores[score] = value;
  }
  for (const factor of Object.keys(PULHES)) {
    const raw = form.get(`pulhes${factor}`);
    if (!raw) errors.push({field: `pulhes-${factor}`, message: `${factor} must be selected.`});
    else input.pulhes[factor] = raw === "unknown" ? null : Number(raw);
  }
  for (const field of ["colorVision", "citizenship", "driversLicense", "clearanceEligible", "splitTrainingOption", "lineScoreWaiverRequested"]) {
    const value = form.get(field);
    if (!value) errors.push({field, message: `${fieldLabel(field)} must be selected.`});
    input[field] = value;
  }

  if (errors.length) {
    showValidationErrors(errors);
    return;
  }

  try { await ensureCatalog(); } catch { return; }
  state.evaluation = state.catalog.map(record => evaluateMos(record, input)).sort(resultSort);
  renderResults();
  navigate("results");
  announce(`${state.evaluation.filter(record => record.eligibility.status === "eligible").length} MOS options meet all modeled requirements.`);
}

function fieldLabel(field) {
  return ({colorVision:"Color vision",citizenship:"Citizenship",driversLicense:"Driver’s license",clearanceEligible:"Clearance eligibility",splitTrainingOption:"Split Training Option",lineScoreWaiverRequested:"Waiver scenario"})[field] || field;
}

function clearValidationErrors() {
  $("#error-summary").hidden = true;
  $$('[aria-invalid="true"]').forEach(field => field.removeAttribute("aria-invalid"));
  $$(".field-error").forEach(node => node.textContent = "");
}

function showValidationErrors(errors) {
  const summary = $("#error-summary");
  summary.innerHTML = `<h2>Check ${errors.length} field${errors.length === 1 ? "" : "s"}</h2><ul>${errors.map(error => `<li><a href="#${escapeHtml(error.field)}">${escapeHtml(error.message)}</a></li>`).join("")}</ul>`;
  summary.hidden = false;
  errors.forEach(error => {
    const field = document.getElementById(error.field) || $(`[name="${error.field}"]`);
    if (field) {
      field.setAttribute("aria-invalid", "true");
      const message = document.getElementById(`error-${error.field}`);
      if (message) message.textContent = error.message;
    }
  });
  summary.focus();
  announce(`${errors.length} required field${errors.length === 1 ? " needs" : "s need"} attention.`);
}

function clearForm() {
  $("#eligibility-form").reset();
  clearValidationErrors();
  updateFormCompletion();
  state.evaluation = [];
  clearDraft();
}

function evaluateMos(record, input) {
  const criteria = [];
  const line = evaluateLineRule(record.requirements.line_score_text, input.lineScores, input.lineScoreWaiverRequested === "yes", record.title);
  criteria.push({...line, kind: "Line score"});
  criteria.push({...evaluatePulhes(record.requirements.pulhes_text, input.pulhes), kind: "PULHES"});
  criteria.push({...evaluateVision(record.requirements.vision_text, input.colorVision), kind: "Color vision"});

  const checks = record.requirements.excel_checks || {};
  criteria.push(evaluateAdministrative(checks.security_clearance, input.clearanceEligible, "Clearance screening"));
  criteria.push(evaluateAdministrative(checks.drivers_license, input.driversLicense, "Driver’s license"));
  criteria.push(evaluateAdministrative(checks.citizenship, input.citizenship === "us_citizen" ? "yes" : input.citizenship === "non_citizen" ? "no" : "unknown", "Citizenship"));
  criteria.push(evaluateAdministrative(checks.split_training_option, input.splitTrainingOption, "Split Training Option"));
  criteria.push(evaluateAdministrative(checks.line_score_waiver, input.lineScoreWaiverRequested, "Workbook waiver condition", true));

  const relevant = criteria.filter(item => item.status !== "not_applicable");
  let status = "eligible";
  if (relevant.some(item => item.status === "fail")) status = "ineligible";
  else if (relevant.some(item => item.status === "unknown")) status = "review";
  else if (line.status === "waiver") status = "waiver";

  return {...record, eligibility: {status, criteria, scoreGap: line.gap || 0}};
}

function evaluateLineRule(rawRule, scores, waiverRequested, title) {
  const rule = String(rawRule || "N/A").trim();
  if (!rule || /^N\/?A$/i.test(rule)) return {status: "pass", summary: "No line-score threshold in the workbook", required: rule || "N/A"};
  const branches = rule.split(/\s+or\s+/i).map(branch => branch.split(",").map(part => part.trim()).filter(Boolean));
  const evaluated = branches.map(branch => {
    const checks = branch.map(expression => {
      const match = expression.match(/^(GT|GM|EL|CL|MM|SC|CO|FA|OF|ST)\s*>=\s*(\d+)$/i);
      if (!match) return {pass: false, unknown: true, expression};
      const key = match[1].toUpperCase();
      const required = Number(match[2]);
      const actual = scores[key];
      return {pass: actual >= required, key, required, actual, gap: Math.max(0, required - actual), expression};
    });
    return {pass: checks.every(check => check.pass), unknown: checks.some(check => check.unknown), checks, gap: Math.max(...checks.map(check => check.gap || 0), 0)};
  });
  const passed = evaluated.find(branch => branch.pass);
  if (passed) return {status: "pass", summary: `Meets ${rule}`, required: rule, actual: summarizeActual(passed.checks), gap: 0, checks: passed.checks};
  if (evaluated.some(branch => branch.unknown)) return {status: "unknown", summary: `Rule needs review: ${rule}`, required: rule};

  const closest = [...evaluated].sort((a, b) => a.gap - b.gap)[0];
  const failedChecks = closest.checks.filter(check => !check.pass);
  const waiverCap = /3\s*pt/i.test(title) ? 3 : 5;
  const waiverPossible = waiverRequested && failedChecks.length > 0 && failedChecks.every(check => check.key !== "GT" && check.gap <= waiverCap);
  if (waiverPossible) return {status: "waiver", summary: `Within a modeled non-GT waiver scenario; approval is not guaranteed`, required: rule, actual: summarizeActual(closest.checks), gap: closest.gap, checks: closest.checks};
  return {status: "fail", summary: `Does not yet meet ${rule}`, required: rule, actual: summarizeActual(closest.checks), gap: closest.gap, checks: closest.checks};
}

function summarizeActual(checks) {
  return checks.filter(check => check.key).map(check => `${check.key} ${check.actual}`).join(", ");
}

function evaluatePulhes(rawRule, actual) {
  const rule = String(rawRule || "");
  const required = {};
  for (const match of rule.matchAll(/([PULHES])\s*=\s*([1-4])/gi)) required[match[1].toUpperCase()] = Number(match[2]);
  if (Object.keys(required).length !== 6) return {status: "unknown", summary: "PULHES rule needs source review", required: rule};
  const unknown = Object.keys(required).some(key => actual[key] == null);
  if (unknown) return {status: "unknown", summary: "Official PULHES not yet available", required: formatPulhes(required), actual: formatPulhes(actual)};
  const failures = Object.keys(required).filter(key => actual[key] > required[key]);
  return failures.length
    ? {status: "fail", summary: `Profile exceeds the workbook maximum for ${failures.join(", ")}`, required: formatPulhes(required), actual: formatPulhes(actual), requiredValues: required, actualValues: actual, failures}
    : {status: "pass", summary: "Profile meets the workbook maximums", required: formatPulhes(required), actual: formatPulhes(actual)};
}

function formatPulhes(values) {
  return Object.keys(PULHES).map(key => values[key] == null ? "?" : values[key]).join("");
}

function evaluateVision(rawRule, actual) {
  const rule = String(rawRule || "").toLowerCase();
  if (actual === "unknown") return {status: "unknown", summary: "Color-vision status is unknown", required: rawRule};
  let pass = false;
  if (rule.includes("red") && rule.includes("green")) pass = actual === "normal" || actual === "red_green";
  else if (rule.includes("normal") || rule.includes("no color")) pass = actual === "normal";
  else return {status: "unknown", summary: "Vision rule needs source review", required: rawRule};
  return {status: pass ? "pass" : "fail", summary: pass ? "Color-vision response meets the modeled rule" : "Color-vision response does not meet the modeled rule", required: rawRule, actual: actual.replaceAll("_", " ")};
}

function evaluateAdministrative(formula, actual, kind, ignoreFailure = false) {
  if (!formula || !String(formula).startsWith("=")) return {kind, status: "not_applicable", summary: "No workbook check"};
  const normalized = String(formula).toUpperCase();
  const acceptsYes = normalized.includes('="YES"');
  const acceptsNo = normalized.includes('="NO"');
  if (actual === "unknown") return {kind, status: "unknown", summary: `${kind} needs recruiter review`};
  if (acceptsYes && acceptsNo) return {kind, status: "pass", summary: `${kind} response recorded`};
  const required = acceptsYes ? "yes" : acceptsNo ? "no" : null;
  if (!required) return {kind, status: "unknown", summary: `${kind} formula needs source review`};
  const pass = actual === required;
  if (ignoreFailure && !pass) return {kind, status: "not_applicable", summary: "Waiver scenario handled with line-score rule"};
  return {kind, status: pass ? "pass" : "fail", summary: pass ? `${kind} condition met` : `${kind} requires “${required}” in the workbook`, required, actual};
}

function resultSort(a, b) {
  const eligibilityOrder = {eligible: 0, waiver: 1, review: 2, ineligible: 3};
  const availabilityOrder = {current_public_posting: 0, idaho_catalog_listed_no_current_posting_seen: 1, idaho_availability_not_publicly_verified: 2};
  return eligibilityOrder[a.eligibility.status] - eligibilityOrder[b.eligibility.status]
    || availabilityOrder[a.idaho_availability.status] - availabilityOrder[b.idaho_availability.status]
    || a.mos.localeCompare(b.mos);
}

function scheduleResultsRender() {
  if (resultRenderTimer) clearTimeout(resultRenderTimer);
  resultRenderTimer = setTimeout(() => {
    resultRenderTimer = null;
    renderResults();
  }, 100);
}

function scheduleCareersRender() {
  if (careerRenderTimer) clearTimeout(careerRenderTimer);
  careerRenderTimer = setTimeout(() => {
    careerRenderTimer = null;
    renderCareers();
  }, 100);
}

function renderResults() {
  if (resultRenderTimer) {
    clearTimeout(resultRenderTimer);
    resultRenderTimer = null;
  }
  const empty = $("#results-list");
  const count = $("#result-count");
  if (!state.evaluation.length) {
    if (empty) empty.innerHTML = `<div class="empty-state"><h2>No evaluation yet</h2><p>Enter your information to generate explained results.</p></div>`;
    const summary = $("#result-summary");
    if (summary) summary.textContent = "Complete the eligibility form to see results.";
    if (count) count.textContent = "";
    const active = $("#result-active-filters");
    if (active) active.innerHTML = "";
    return;
  }
  const counts = state.evaluation.reduce((acc, item) => (acc[item.eligibility.status]++, acc), {eligible:0,waiver:0,review:0,ineligible:0});
  const summary = $("#result-summary");
  if (summary) {
    summary.innerHTML = `<span class="tally tally-eligible">${counts.eligible} eligible</span><span class="tally tally-waiver">${counts.waiver} waiver</span><span class="tally tally-review">${counts.review} review</span><span class="tally tally-ineligible">${counts.ineligible} not eligible yet</span>`;
  }
  const queryText = $("#result-search").value.trim();
  const query = queryText.toLowerCase();
  const category = $("#result-category").value;
  const status = $("#result-status").value;
  const filtered = state.evaluation.filter(record => matchesQuery(record, query) && (category === "all" || record.category === category) && (status === "all" || record.eligibility.status === status));
  if (count) count.textContent = `Showing ${filtered.length} of ${state.evaluation.length} evaluated MOSs`;
  renderResultActiveFilters(queryText, category, status);
  renderGrouped(filtered, $("#results-list"), true);
}

function clearResultFilters() {
  $("#result-search").value = "";
  $("#result-category").value = "all";
  $("#result-status").value = "all";
  renderResults();
}

function renderResultActiveFilters(query, category, status) {
  const target = $("#result-active-filters");
  if (!target) return;
  const chips = [];
  if (query) chips.push(`<button class="filter-chip" type="button" data-clear-result="query">Search: “${escapeHtml(query)}” <em aria-hidden="true">×</em></button>`);
  if (category !== "all") chips.push(`<button class="filter-chip" type="button" data-clear-result="category">Category: ${escapeHtml(category)} <em aria-hidden="true">×</em></button>`);
  if (status !== "all") {
    const label = ({eligible:"Eligible", waiver:"Waiver scenario", review:"Needs review", ineligible:"Not eligible yet"})[status] || status;
    chips.push(`<button class="filter-chip" type="button" data-clear-result="status">Result: ${escapeHtml(label)} <em aria-hidden="true">×</em></button>`);
  }
  target.innerHTML = chips.length ? chips.join("") : `<span class="muted-note">No filters applied</span>`;
}

function clearResultChip(key) {
  if (key === "query") $("#result-search").value = "";
  if (key === "category") $("#result-category").value = "all";
  if (key === "status") $("#result-status").value = "all";
  renderResults();
}

function renderCareers() {
  if (careerRenderTimer) {
    clearTimeout(careerRenderTimer);
    careerRenderTimer = null;
  }
  if (!state.catalog.length) return;
  const queryText = $("#career-search").value.trim();
  const query = queryText.toLowerCase();
  const category = $("#career-category").value;
  const availability = $("#career-availability").value;
  const sort = $("#career-sort") ? $("#career-sort").value : "mos";
  const filtered = state.catalog.filter(record => matchesQuery(record, query) && (category === "all" || record.category === category) && matchesAvailability(record, availability));
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title) || a.mos.localeCompare(b.mos);
    if (sort === "category") return a.category.localeCompare(b.category) || a.mos.localeCompare(b.mos);
    if (sort === "availability") return availabilitySortValue(a) - availabilitySortValue(b) || a.mos.localeCompare(b.mos);
    return a.mos.localeCompare(b.mos);
  });
  $("#career-count").textContent = `${sorted.length} of ${state.catalog.length} pathways shown`;
  $("#career-list").innerHTML = sorted.length ? sorted.map(record => mosCard(record)).join("") : emptyState("No careers match those filters.");
  renderCareerActiveFilters(queryText, category, availability, sort);
}

function availabilitySortValue(record) {
  const availability = record.idaho_availability;
  if (availability.current_public_posting_seen) return 0;
  if (availability.catalog_listed) return 1;
  return 2;
}

function clearCareerFilters() {
  $("#career-search").value = "";
  $("#career-category").value = "all";
  $("#career-availability").value = "all";
  if ($("#career-sort")) $("#career-sort").value = "mos";
  renderCareers();
}

function renderCareerActiveFilters(query, category, availability, sort) {
  const target = $("#career-active-filters");
  if (!target) return;
  const chips = [];
  if (query) chips.push(`<button class="filter-chip" type="button" data-clear-career="query">Search: “${escapeHtml(query)}” <em aria-hidden="true">×</em></button>`);
  if (category !== "all") chips.push(`<button class="filter-chip" type="button" data-clear-career="category">Category: ${escapeHtml(category)} <em aria-hidden="true">×</em></button>`);
  if (availability !== "all") {
    const label = ({current:"Posting seen", catalog:"Idaho catalog-listed", unverified:"Availability unverified"})[availability] || availability;
    chips.push(`<button class="filter-chip" type="button" data-clear-career="availability">Idaho: ${escapeHtml(label)} <em aria-hidden="true">×</em></button>`);
  }
  if (sort !== "mos") {
    const label = ({title:"Job title", category:"Category", availability:"Idaho evidence"})[sort] || sort;
    chips.push(`<button class="filter-chip" type="button" data-clear-career="sort">Sort: ${escapeHtml(label)} <em aria-hidden="true">×</em></button>`);
  }
  target.innerHTML = chips.length ? chips.join("") : `<span class="muted-note">No filters applied</span>`;
}

function clearCareerChip(key) {
  if (key === "query") $("#career-search").value = "";
  if (key === "category") $("#career-category").value = "all";
  if (key === "availability") $("#career-availability").value = "all";
  if (key === "sort" && $("#career-sort")) $("#career-sort").value = "mos";
  renderCareers();
}

function renderGrouped(records, target, withEligibility) {
  if (!records.length) { target.innerHTML = emptyState("No MOSs match those filters."); return; }
  const groups = records.reduce((map, record) => {
    if (!map.has(record.category)) map.set(record.category, []);
    map.get(record.category).push(record);
    return map;
  }, new Map());
  target.innerHTML = [...groups.entries()].map(([category, items]) => `<section class="category-section"><h2>${escapeHtml(category)} <small>(${items.length})</small></h2><div class="result-list">${items.map(record => mosCard(record, withEligibility)).join("")}</div></section>`).join("");
}

function matchesQuery(record, query) {
  return !query || [record.mos, record.title, record.description, record.category, record.subcategory].join(" ").toLowerCase().includes(query);
}

function matchesAvailability(record, filter) {
  const availability = record.idaho_availability;
  if (filter === "current") return availability.current_public_posting_seen;
  if (filter === "catalog") return availability.catalog_listed && !availability.current_public_posting_seen;
  if (filter === "unverified") return !availability.catalog_listed && !availability.current_public_posting_seen;
  return true;
}

function mosCard(record, withEligibility = false) {
  const saved = state.saved.has(record.mos);
  const resultBadge = withEligibility ? eligibilityBadge(record.eligibility.status) : availabilityBadge(record);
  return `<article class="mos-row">
    <div class="mos-row-main">
      <div class="mos-row-head"><span class="mos-code">${escapeHtml(record.mos)}</span><h3>${escapeHtml(record.title)}</h3></div>
      <p class="mos-row-eyebrow">${escapeHtml(record.category)} · ${escapeHtml(record.subcategory)}</p>
      <p class="mos-row-desc">${escapeHtml(record.description)}</p>
      ${withEligibility ? eligibilityExplanation(record) : ""}
    </div>
    <div class="mos-row-meta">
      <div class="mos-badges">${resultBadge}</div>
      <div class="mos-row-actions">
        <button class="link-button" type="button" data-detail="${escapeHtml(record.mos)}">View details</button>
        <button class="save-button" type="button" data-save="${escapeHtml(record.mos)}" aria-label="${saved ? "Remove" : "Save"} ${escapeHtml(record.mos)}" aria-pressed="${saved}">${saved ? "★" : "☆"}</button>
      </div>
    </div>
  </article>`;
}

function eligibilityExplanation(record) {
  const status = record.eligibility?.status;
  if (!status || status === "eligible") return "";
  const blockers = record.eligibility.criteria.filter(criterion => criterion.status === "fail" || criterion.status === "unknown" || criterion.status === "waiver");
  const heading = status === "ineligible" ? "Why you’re not eligible yet" : status === "review" ? "What still needs review" : "Why this is a waiver scenario";
  const items = blockers.slice(0, 2).map(criterion => `<li><span>${escapeHtml(explainCriterion(criterion))}</span><small>${escapeHtml(nextStepFor(criterion))}</small></li>`).join("");
  const remaining = blockers.length - 2;
  return `<div class="eligibility-note status-panel-${escapeHtml(status)}"><strong>${heading}</strong><ul>${items}</ul>${remaining > 0 ? `<p class="more-reasons">+${remaining} more requirement${remaining === 1 ? "" : "s"} in details</p>` : ""}</div>`;
}

function explainCriterion(criterion) {
  if (criterion.kind === "Line score" && criterion.status === "fail") {
    const gaps = (criterion.checks || []).filter(check => check.key && !check.pass).map(check => `${check.key} is ${check.actual}; ${check.required} is required (${check.gap} point${check.gap === 1 ? "" : "s"} short)`);
    return gaps.length ? gaps.join("; ") : criterion.summary;
  }
  if (criterion.kind === "Line score" && criterion.status === "waiver") return `${criterion.actual}; modeled within the workbook’s non-GT waiver range`;
  if (criterion.kind === "PULHES" && criterion.failures?.length) {
    return criterion.failures.map(key => `${key} is ${criterion.actualValues[key]}; maximum ${criterion.requiredValues[key]}`).join("; ");
  }
  if (criterion.kind === "Citizenship" && criterion.status === "fail") return "The workbook requires U.S. citizenship for this MOS.";
  if (criterion.kind === "Driver’s license" && criterion.status === "fail") return "The workbook requires a valid driver’s license for this MOS.";
  if (criterion.kind === "Split Training Option" && criterion.status === "fail") return "This MOS is not modeled as available through the Split Training Option.";
  if (criterion.kind === "Clearance screening" && criterion.status === "fail") return "The clearance screening response does not meet this MOS requirement.";
  return criterion.summary;
}

function nextStepFor(criterion) {
  if (criterion.kind === "Line score") return criterion.status === "waiver" ? "Ask a recruiter whether a line-score waiver can be submitted; approval is not guaranteed." : "Focus study on the listed line-score area, then ask about retesting and score-improvement options.";
  if (criterion.kind === "PULHES") return "Ask a recruiter or MEPS counselor to verify the official profile and MOS medical standard.";
  if (criterion.kind === "Color vision") return "Confirm the official color-vision result and ask about MOSs with a compatible standard.";
  if (criterion.kind === "Driver’s license") return "Obtain or verify a valid license, or compare MOSs without this workbook requirement.";
  if (criterion.kind === "Citizenship") return "Ask a recruiter which MOSs are open for your current citizenship status.";
  if (criterion.kind === "Split Training Option") return "Compare MOSs compatible with your training timeline or discuss another ship plan.";
  if (criterion.kind === "Clearance screening") return "Have a recruiter review the issue; only the official process can determine clearance eligibility.";
  return "Have a recruiter verify this requirement before choosing an MOS.";
}

function eligibilityBadge(status) {
  const labels = {eligible:"Eligible",waiver:"Waiver scenario",review:"Needs review",ineligible:"Not eligible yet"};
  return `<span class="status-badge status-${status}">${labels[status]}</span>`;
}

function availabilityBadge(record) {
  const availability = record.idaho_availability;
  if (availability.current_public_posting_seen) return `<span class="status-badge status-current">Posting seen</span>`;
  if (availability.catalog_listed) return `<span class="status-badge status-catalog">Idaho catalog</span>`;
  return `<span class="status-badge status-unverified">Unverified</span>`;
}

function availabilityText(record) {
  const availability = record.idaho_availability;
  if (availability.current_public_posting_seen) return `Public Idaho posting seen as of ${availability.as_of}. Recruiter confirmation required.`;
  if (availability.catalog_listed) return `Listed in Idaho’s public career catalog; no current posting was seen as of ${availability.as_of}. Recruiter confirmation required.`;
  return `Idaho availability was not publicly verified as of ${availability.as_of}. Ask about related ${record.subcategory} opportunities.`;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function handleDelegatedClick(event) {
  const detail = event.target.closest("[data-detail]");
  if (detail) openDetail(detail.dataset.detail);
  const save = event.target.closest("[data-save]");
  if (save) toggleSaved(save.dataset.save);
  const resultChip = event.target.closest("[data-clear-result]");
  if (resultChip) clearResultChip(resultChip.dataset.clearResult);
  const careerChip = event.target.closest("[data-clear-career]");
  if (careerChip) clearCareerChip(careerChip.dataset.clearCareer);
}

function openDetail(mos, refreshOnly = false) {
  const record = (state.evaluation.find(item => item.mos === mos) || state.catalog.find(item => item.mos === mos));
  if (!record) return;
  const criteria = record.eligibility?.criteria || [];
  const videoUrl = safeHttpUrl(record.video_url);
  $("#dialog-content").innerHTML = `<div class="detail-title"><p class="eyebrow">${escapeHtml(record.category)} · ${escapeHtml(record.subcategory)}</p><h2 id="dialog-title">${escapeHtml(record.mos)} ${escapeHtml(record.title)}</h2></div>
    <div class="detail-meta">${record.eligibility ? eligibilityBadge(record.eligibility.status) : ""}${availabilityBadge(record)}</div>
    <p class="detail-intro">${escapeHtml(record.description)}</p>
    <section class="detail-section"><h3>Idaho status</h3><p>${escapeHtml(availabilityText(record))}</p></section>
    ${criteria.length ? `<section class="detail-section"><h3>Why this result</h3><ul class="criteria-list">${criteria.filter(c => c.status !== "not_applicable").map(c => `<li class="${c.status === "fail" ? "fail" : c.status === "unknown" ? "unknown" : ""}"><strong>${escapeHtml(c.kind)}:</strong> ${escapeHtml(c.summary)}</li>`).join("")}</ul></section>` : ""}
    <section class="detail-section"><h3>Workbook requirements</h3><div class="requirement-grid"><div class="requirement-item"><strong>Line score</strong><span>${escapeHtml(record.requirements.line_score_text)}</span></div><div class="requirement-item"><strong>PULHES</strong><span>${escapeHtml(record.requirements.pulhes_text)}</span></div><div class="requirement-item"><strong>Vision</strong><span>${escapeHtml(record.requirements.vision_text)}</span></div><div class="requirement-item"><strong>Physical demand</strong><span>${escapeHtml(record.requirements.physical_demand || "Not listed")}</span></div><div class="requirement-item"><strong>AIT</strong><span>${escapeHtml(record.training.ait_length_text || "Confirm with recruiter")}</span></div></div></section>
    ${record.eligibility && record.eligibility.status !== "eligible" ? `<section class="detail-section"><h3>Your path forward</h3><div class="next-step-panel"><ul class="criteria-list">${record.eligibility.criteria.filter(c => ["fail", "unknown", "waiver"].includes(c.status)).map(c => `<li><strong>${escapeHtml(c.kind)}:</strong> ${escapeHtml(explainCriterion(c))}<small>${escapeHtml(nextStepFor(c))}</small></li>`).join("")}</ul></div></section>` : ""}
    <section class="detail-section"><h3>Next step</h3><div class="actions">${videoUrl ? `<a class="button secondary" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener">Watch MOS video</a>` : ""}<button class="button primary" type="button" data-save="${escapeHtml(record.mos)}">${state.saved.has(record.mos) ? "Remove from saved" : "Save this MOS"}</button></div><p class="source-note">Qualification estimate only. Final MOS eligibility and vacancy availability require official review.</p></section>`;
  if (!refreshOnly) $("#mos-dialog").showModal();
}

function toggleSaved(mos) {
  if (state.saved.has(mos)) state.saved.delete(mos); else state.saved.add(mos);
  try { localStorage.setItem("idahoMosSaved", JSON.stringify([...state.saved])); } catch { announce("Saved MOSs are unavailable in this browser mode."); }
  renderCareers();
  if (state.evaluation.length) renderResults();
  renderSaved();
  if ($("#mos-dialog").open) openDetail(mos, true);
  announce(`${mos} ${state.saved.has(mos) ? "saved" : "removed from saved MOSs"}.`);
}

function renderSaved() {
  const records = state.catalog.filter(record => state.saved.has(record.mos));
  const count = $("#saved-count");
  if (count) count.textContent = `${records.length} saved ${records.length === 1 ? "MOS" : "MOSs"} on this device`;
  $("#saved-list").innerHTML = records.length ? records.map(record => mosCard(record)).join("") : emptyState("No MOSs saved yet. Browse careers or save from your results.");
}

function emptyState(message) {
  return `<div class="empty-state"><h2>Nothing to show</h2><p>${escapeHtml(message)}</p></div>`;
}

function announce(message) {
  const region = $("#status-message");
  if (!region) return;
  region.textContent = "";
  window.setTimeout(() => { region.textContent = message; }, 20);
}

init();
