# Security policy — OceanCentinell USA

**Prototype release:** 0.3.0 — **NOT production security certified**.

## Controls implemented
- Local-only data: no analytics or remote application API in this version.
- Escaping of user-entered values before rendering into generated HTML.
- Strict import schema: required fields, allowed status values, date validation, record counts and string limits.
- Transactional persistence: UI changes commit only after localStorage writes succeed.
- Basic spreadsheet formula-injection escaping for CSV exports.
- Content Security Policy: same-origin scripts, styles and connections, blocked objects and embeds. Note that CSP meta cannot enforce every HTTP-header directive; deploy with HTTP CSP headers in production.
- No API tokens or example secrets stored in the repository.
- Automated security validator tests in Node.

## Known limitations
- localStorage is **not encrypted** and may be accessible to the device holder and other same-origin scripts.
- No login, RBAC, MFA, tenant separation, tamper-evident logs, server-side controls, or secure backup service.
- Manual records are not verified against live vessel positions or authoritative sources.
- CSV and JSON downloads contain plaintext operational data; treat them as sensitive.
- No dedicated native Android security assessment or device penetration testing.
- The repository is **public**; changing visibility remains a necessary owner action for proprietary work.

## Reporting vulnerabilities
Use a private security reporting channel established by the repository owner; **do not post exploit details or secrets in public issues**. The owner must add a verified contact before release.

## Production gate
Before handling real customer data, implement authenticated API, least-privilege roles, audit trails, encryption at rest and in transit, privacy notices, test coverage, Android app assessment and release signing. Do not claim FIPS, SOC 2 or other certifications without evidence.
