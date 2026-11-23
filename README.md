# OceanCentinell USA

**Owner / intended publisher:** Beacon of the Eagle LLC  
**Status:** functional local-first MVP **v0.4.0**, not production-ready.  
**Target market:** United States. The release territory must be selected in Google Play Console.

## Features available today
- Responsive English maritime operations dashboard.
- Vessel registry with last **manually reported** location and operational status.
- Asset registry, condition and assignment.
- Incident register, severity, status and notes.
- Maintenance tasks, due dates, overdue count.
- Search, create, edit, delete, sample data.
- JSON backup/restore, CSV exports.
- Browser-local storage and optional installable web experience (PWA), with service worker cache.

## What is **not** implemented
- AIS/GPS live positions, vessel tracking, telemetry, uptime or network probes.
- Automated alerts, push messaging, AI advisor or cloud back-end.
- Accounts, roles, authentication, MFA, encryption at rest, auditing, tenant isolation.
- Native Android release file (APK/AAB), Play Console submission or app-store approval.

**Do not use this app for navigation, emergencies, safety-critical maritime decisions, or confidential/regulated data.** Data is currently stored in the current browser's localStorage; clearing browser data can destroy records. Export a backup before changing browsers or devices. No server sync exists.

## Running locally
Quick preview: open `index.html` in a browser (service worker requires an HTTP(S) origin). For a local development server:

```sh
npm install
npm run dev
```

## Android development (Capacitor 8 / Android API 36; requires Node.js 22+, Android Studio and Android SDK)
```sh
npm install
npm run build
npx cap add android
npm run android:sync
npm run android:open
```
Then sign and test a release **AAB** in Android Studio for Google Play after implementing the required product privacy, production security and compliance features. The application ID in `capacitor.config.json` is a proposal and must be checked for availability. Do not upload an untested build or publish a listing promising live functionality.

## Product roadmap
1. Secure PostgreSQL backend and verified US data residency, signed-in users, per-organization RBAC, audit logs and MFA.
2. Ship/vessel data integrations using properly licensed AIS/GPS inputs; freshness timestamps and source provenance.
3. Real network/asset monitoring via a consented collector/agent (never try to scan from the mobile web page); alert rules.
4. Evidence-safe incident tracking, maintenance notifications and PDF reports.
5. Optional AI guidance with human confirmation, transparent source citations, no automatic operational decisions.
6. Native Android accessibility tests, privacy policy, data-safety disclosures, store screenshots and production review.

## Copyright and branding
Copyright © 2026 Beacon of the Eagle LLC. All rights reserved, subject to verification of actual ownership and contributions. This notice **is not a government registration**. Keep a contribution/provenance record and disclose pre-existing reused code and third-party components in any eventual US Copyright Office filing. Assess `OceanCentinell USA` name availability and trademark separately.

## Public repository caution
This repository was found to be **public**. Do not commit API keys, private maritime telemetry, customer records, secrets or proprietary enterprise source code. Change visibility through repository settings before putting confidential code here. This MVP contains only generic sample data created for demonstration.

## CI / release preparation
GitHub Actions workflow `.github/workflows/android-build.yml` builds a **debug testing APK**, if it completes successfully. See the Actions tab and download the run artifact. A debug build is not a signed production AAB. See `GOOGLE_PLAY_USA.md`, `PRIVACY_POLICY.md`, and `COPYRIGHT_PREPARATION.md` for release and rights checklists.

## Security hardening in v0.4.0
- Data schema validation with row/length limits, strict status values, ISO date checks, and unique record IDs.
- Atomic local writes: failed storage operations do not silently alter the visible dataset.
- Hardened CSV exports against spreadsheet formula injection.
- Same-origin Content Security Policy and separate JavaScript/CSS bundles.
- Regression tests: `npm test` (Node 22+) and CI dependency audit before building the Android debug APK.
- Security limitations and production prerequisites: see `SECURITY.md`.

**Important:** These are prototype-level safeguards, not encryption, user authorization, real-time maritime monitoring, security certification or validation of an Android release.

## Version 0.4.0 — USA Command Center design
The user interface has been redesigned based on the visual language and section structure of the owner's OceanCentinell Enterprise reference (`pizat16/oceancentinell-enterprise`): dark navy/cyan Naval HUD, command banner and segmented navigation.

New planning screens: **Network & OT Architecture**, **Cyber Threat Intelligence**, and **Compliance & Governance**. These screens are informational; they do not connect to AIS, SATCOM, threat feeds, scanners, agents, AI services or regulatory registries. Vessel, asset, incident and maintenance registers remain local and manually populated.

The USA product is a distinct app and does not automatically inherit any production capability, certification, license, API, login, or security control from the Enterprise reference. The reference repository was read to guide layout; no production secrets or Enterprise backend were transferred. GitHub Pages hosting and Google Play production submission are not yet configured/verified for this repository.
