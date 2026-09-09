# Idaho MOS Pathfinder

A static, mobile-first GitHub Pages web app that explores Idaho Army National Guard MOS pathways and estimates eligibility using the uploaded **DA PAM 611-21 Table 10-6 MOS and Line Score Wizard (April 2025)** workbook.

## What it does

- Evaluates ten Army line scores, PULHES, color vision, citizenship, driver’s-license status, clearance screening, Split Training Option status, and modeled waiver scenarios.
- Organizes all 151 workbook records by MOS category.
- Separates applicant eligibility from time-stamped Idaho availability evidence.
- Shows exact requirement gaps, plain-language reasons for every “not eligible yet” result, practical next steps, workbook criteria, training length, and videos where available.
- Saves a shortlist locally without requiring an account or sending personal data.
- Includes accessible validation, status announcements, a documented methodology, search metadata, a sitemap, and a custom 404 page.

## Run locally

The app has no build step. Serve the repository root over HTTP:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

Run the static catalog and application checks with `node tests.mjs`.

## Important limitation

This is a counseling aid, not an official enlistment determination or vacancy reservation. MEPS, current Army policy, Idaho’s authorized vacancy system, security adjudication, medical qualification, and recruiter review control final eligibility and availability.

## Data

`data/mos.json` contains normalized source-workbook records and public Idaho availability evidence observed on September 4, 2026. Qualification source formulas are retained for auditability.

## Deployment

GitHub Pages serves the `main` branch from the repository root. All URLs are relative so the app works beneath a project repository path.
