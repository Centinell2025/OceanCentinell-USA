# OceanCentinell — Company Evaluation

**Beacon of the Eagle LLC · Evaluation edition 0.5.0**

OceanCentinell brings vessel records, equipment, incidents and maintenance into one local workspace. This complimentary sample lets a company evaluate the recordkeeping and reporting workflow before discussing a separately scoped pilot.

## Open the sample

Download and extract the package, then open **OceanCentinell_Company_Demo.html** in a current desktop Chrome, Edge or Firefox browser. The HTML contains its own code and styles; no installation, account or API key is required. Download the actual file rather than using an email attachment preview, which may block scripts. If local storage is blocked, the app displays a notice and pauses changes.

The initial sample contains 3 fictional vessels, 5 equipment records, 3 incidents and 4 maintenance tasks. Due dates are relative to the first opening. Sample records remain labeled as synthetic after editing. New records are labeled as manual entries. The sample does not collect analytics or send record data to a server.

## Five-minute demonstration

1. **Command center:** review the fleet, open incidents and overdue maintenance. Counts come from the local records.
2. **Vessel registry:** search for Atlantic Pioneer and open Review. Inspect the reported location and status.
3. **Incident log:** add a fictional observation, assign severity and save. Review its details, then change its status to Resolved. The open count updates.
4. **Maintenance:** add a task with a due date. A pending task dated before today appears as overdue.
5. **Reports & backups:** preview the briefing. Export TXT, CSV or a JSON workspace. Use Print / save PDF for a browser-produced PDF.
6. **Company evaluation:** enter a proposed company scope and operational goal, then download a pilot brief. This creates a local file; nothing is submitted or sent.

## Evaluation capabilities

| Capability | Included in this sample |
|---|---|
| Vessel and equipment registers | Create, search, review, edit and delete local records |
| Incident documentation | Manually assigned severity, status and notes |
| Maintenance planning | Due dates, pending queue and overdue counts |
| Briefing and portability | TXT, CSV, JSON and browser print / PDF |
| Backup import | Adds new IDs; existing records are preserved |
| Fleet positions / AIS / GPS | No live connection; manually reported locations only |
| AI, network probes and threat feeds | Not configured or connected |
| Company accounts, roles and cloud sync | Not implemented in this evaluation |

## Backups and local data

Export JSON before clearing browser data, moving the file, changing browser or device. Local-file storage behavior varies between browsers. Imports accept OceanCentinell JSON backups up to 5 MB and 1,000 records per register; existing IDs are skipped to preserve current edits. To transfer changes to an existing ID, review and edit that record rather than expecting an import to overwrite it. Exports are readable text, not encrypted archives.

Use fictional or non-confidential information. This sample is not a navigation, emergency-response, compliance-certification or production monitoring service.

## Define a company pilot

A follow-up evaluation should agree on the operational problem, vessels or sites, authorized data sources, user roles, integration boundaries, security requirements, measurable acceptance criteria, responsibilities, duration and price. Enterprise integrations and company licensing are separately scoped. The sample does not activate a paid subscription or commit either party to a pilot.

**Contact:** centinellsuite@gmail.com  
**Subject:** OceanCentinell company evaluation

A mobile paid edition is a separate next step. This package is the complimentary company demonstration, not a Google Play release.

## Validation

14 automated tests cover counts, backup round-trips, legacy imports, merge preservation and capacity limits, date and schema validation, malformed backups, CSV formula protection, HTML escaping and report content. Browser checks covered navigation, record creation, review, search, editing, reload persistence and JSON download. A browser import round-trip was interrupted and is not claimed as completed; the underlying import and merge logic passed automated tests.

Copyright © 2026 Beacon of the Eagle LLC. Evaluation material. All rights reserved. No certification, registration or production deployment is implied.

## Source validation

Run `node --test tests/*.test.mjs` and `node scripts/build.mjs` from this directory using Node.js 22 or later. The self-contained HTML is generated in `dist/`. No dependency installation is needed for this evaluation build.
