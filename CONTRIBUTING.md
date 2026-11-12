# Contributing to NoxaPlus Ledger

Thanks for taking the time to improve the ledger. This project is intentionally small and dependency-light; contributions that keep it that way are especially welcome.

## Before you start

- Read the [README](README.md) to understand the product and its privacy constraints.
- Search existing issues before opening a new one.
- For security problems, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Ground rules

- The app must stay local-first. Do not add analytics, telemetry, remote fonts, CDNs, API keys or server calls.
- Keep `src/core` framework-free and pure. Browser access belongs in hooks or components.
- Money is stored as positive Toman integers; the transaction type carries direction.
- Dates are Jalali `YYYY-MM-DD` keys with Latin digits.
- Preserve RTL layout and accessible names. Every icon-only button needs an `aria-label`.
- Do not introduce a UI, charting or date library for something the project already solves by hand.
- New behavior needs a test when it lives in `src/core`.

## Development workflow

```bash
npm install
npm run dev
```

Before submitting a pull request, run:

```bash
npm run typecheck
npm test
npm run build
```

Please also exercise the affected flow in a browser, including a narrow viewport when you touch layout or dialogs.

## Commit and pull request style

- Keep commits focused; one logical change per commit.
- Use the imperative mood in the subject line, for example `Fix amount field overflow on mobile`.
- Describe the user-visible change and the reasoning in the pull request, not just the files touched.
- Link related issues and include screenshots for visual changes.
- Do not commit generated output (`dist/`), local backups or personal data.

## Persian text and formatting

- Use Persian digits in the UI through the formatter facade, never hard-coded numerals.
- Wrap signed amounts with the formatter (`fmt.signedMoney`) so direction marks render on the leading edge in RTL.
- Keep user-facing copy concise and consistent with the existing tone.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
