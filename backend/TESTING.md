# Backend Tests

Run backend tests (recommended in CI if Codespaces filesystem errors occur):

```bash
cd backend
npm ci
npm test
```

If you see filesystem provider errors (ENOPRO) in Codespaces, run tests in GitHub Actions by pushing your branch/PR — CI will run the tests and upload JUnit XML reports to `backend/reports/`.
