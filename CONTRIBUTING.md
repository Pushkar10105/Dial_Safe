# Contributing to DialSafe

## Git workflow

### Branches
- `main` is always demo-ready. **Nobody pushes directly to main.**
- Branch names follow the pattern: `feat/<folder>-<short-description>`
  - Example: `feat/bot-intent-routing`, `feat/backend-check-endpoint`, `feat/frontend-number-detail`

### Starting work
1. Pull from `main` before starting any work: `git pull origin main`
2. Create a new branch: `git checkout -b feat/<folder>-<short-description>`
3. Commit small and often.

### Commits
Use one of these prefixes in every commit message:

| Prefix | When to use |
|---|---|
| `feat:` | A new feature or capability |
| `fix:` | A bug fix |
| `docs:` | Documentation changes only |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance, config, tooling changes |

Example: `feat: add /check endpoint with verdict and score`

### Pull requests
- Open a pull request to `main` for every piece of work.
- At least one other team member must review and approve before merging.
- Fill in the pull request template fully.
- **Never force push.**

### Secrets
- Secrets never go in the repository.
- Use a local `.env` file (it is gitignored).
- Share keys with teammates privately, never via a commit or PR comment.
- Keep `.env.example` updated with variable names and empty values when you add a new secret.
