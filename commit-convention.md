# Commit convention

SpreadNotes uses Conventional Commits:

```text
<type>(<scope>): <imperative summary>
```

Allowed types:

- `feat` — new product capability
- `fix` — bug correction
- `refactor` — behavior-preserving restructuring
- `style` — visual or formatting-only change
- `content` — product copy or seeded content
- `docs` — documentation-only change
- `test` — test changes
- `build` — tooling, dependency, or deployment changes
- `chore` — maintenance work

Preferred scopes:

- `auth`
- `workspaces`
- `composer`
- `media`
- `previews`
- `connections`
- `publishing`
- `platforms`
- `ai`
- `ui`
- `infra`

Rules:

- Use an imperative summary, lowercase after the colon, and no period.
- Keep the subject under 72 characters when possible.
- Keep commits focused on one coherent change.
- Do not mix unrelated refactors with feature work.
- Do not commit secrets, `.env` files, dependency directories, build output, or generated credentials.
- Mention migrations, API approvals, or breaking changes in the commit body when relevant.

Examples:

```text
feat(composer): add draft autosave
feat(previews): render Instagram carousel constraints
fix(publishing): prevent duplicate scheduled posts
build(infra): configure Supabase environment variables
docs(platforms): record TikTok approval requirements
```
