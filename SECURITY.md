# Security Policy

## Supported versions

Only the latest release on the `main` branch receives fixes.

| Version | Supported |
| --- | --- |
| 1.x | Yes |

## Reporting a vulnerability

Please email **NoxaPlus2025@gmail.com** with:

- a description of the issue and its impact,
- steps to reproduce,
- the browser and operating system you used,
- any proof-of-concept files or screenshots.

Do not open a public issue for security reports. You should receive an acknowledgement within a few days. Once the issue is confirmed and fixed, we will credit you in the release notes unless you prefer to stay anonymous.

## Scope and threat model

NoxaPlus Ledger is a static, local-first application with no backend, no accounts and no network calls. Relevant risks therefore center on the browser environment:

- **Local data exposure** — the ledger is stored unencrypted in `localStorage`. Anyone with access to the browser profile or device can read it. Use full-disk encryption and lock your device.
- **Malicious backups or CSV files** — imports are parsed as data, validated and never executed. Very large files can still exhaust memory; import only files you trust.
- **Cross-site scripting** — React escapes rendered text. A reported XSS vector would be treated as a security issue.
- **Supply chain** — dependencies are kept minimal and reviewed in pull requests. The app performs no runtime requests to third parties.
- **Service worker** — caches only same-origin assets and navigation responses.

The project does not protect against a compromised device, a malicious browser extension, or an attacker who can already read the user's browser storage.
