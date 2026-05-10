# Deployment Process

This project uses manual production deployments.

## What Changed

- Vercel Git auto-deployments are disabled in `vercel.json`.
- Pull requests and pushes to `main` run CI only.
- Production deployment is started manually from GitHub Actions.

## Required GitHub Secrets

Add these repository secrets before using the manual deploy workflow:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Current local Vercel project values:

```text
VERCEL_ORG_ID=team_QDtxlUnhRHCLfOnVXWgB6VmV
VERCEL_PROJECT_ID=prj_qK60s5btLTPOPjkRDv0W5MbRQt6J
```

Do not commit `VERCEL_TOKEN`. Add it only as a GitHub Actions secret.

## Manual Production Deploy

1. Merge approved changes into `main`.
2. Open the GitHub repository.
3. Go to `Actions`.
4. Choose `Manual Production Deploy`.
5. Click `Run workflow`.
6. Keep `ref` as `main`, unless deploying a specific tag or SHA.
7. Confirm the workflow passes tests, builds, and deploys to Vercel production.

## CI Only

The `CI` workflow runs tests and builds on pull requests and pushes to `main`. It does not deploy.
