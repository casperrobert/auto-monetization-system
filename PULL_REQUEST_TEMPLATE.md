This PR bundles the recent validation and test improvements.

What changed:
- Export Express app (`backend/src/app.js`) and make server entry conditional.
- Use `validateSchema` middleware for `streams-config` route.
- Extend StreamConfig schema with subschemas (dividends, p2p, reits, courses, apps).
- Add integration and unit tests.

Testing:
- CI will run Jest and upload JUnit reports to `backend/reports/`.
- See `backend/TESTING.md` for local run instructions.

Notes:
- If local tests fail due to Codespace FS provider errors, run CI.
