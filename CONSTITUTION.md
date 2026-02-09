# AI Digest Project Constitution

> Governance rules discovered from codebase analysis. Enforced during `/start:implement`, `/start:validate`, `/start:review`.

---

## Validation (6 rules)

### L1-V1: Functional Validation Mandate (ABSOLUTE)

**ZERO test files. ZERO test frameworks. ALL validation through REAL systems.**

- Never create `*.test.ts`, `*.spec.ts`, or `__tests__/` directories
- Never install jest, vitest, mocha, or any test runner
- Never write mocks, stubs, test doubles, or in-memory databases
- Never use jsdom, happy-dom, Testing Library, or component isolation
- Validate through real running applications, real databases, real HTTP requests

### L1-V2: Backend Validation via curl

All backend API validation uses `curl` against real running servers:

```bash
# Auth flow
curl -s -c /tmp/ai-cookie.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@digest.ai","password":"..."}'

# Authenticated requests
curl -s --cookie /tmp/ai-cookie.txt http://localhost:3000/api/admin/config | jq .success

# Database verification
psql ai_digest_dev -c "SELECT count(*) FROM digests WHERE status='ready'"
```

### L1-V3: Frontend Validation via Browser Automation

All frontend validation uses Playwright MCP or agent-browser skill:

- Capture screenshots at 3 breakpoints: **375px** (mobile), **768px** (tablet), **1440px** (desktop)
- Navigate real pages in real browser against running dev server
- Verify visual rendering, not DOM structure

### L1-V4: Evidence Gate

**Never claim completion without captured evidence:**

1. **CAPTURE** evidence (screenshot, curl output, psql result)
2. **READ** the evidence (actually view screenshots, parse JSON responses)
3. **VERIFY** it shows expected behavior
4. **ONLY THEN** claim completion

### L2-V5: Backend Log Correlation

After triggering operations, verify backend state:

- Check database with `psql` queries
- Check Redis with `redis-cli`
- Check worker logs for stage transitions
- Correlate frontend behavior with backend data

### L2-V6: Service Orchestration for Validation

Start real services before validation:

```bash
# Worker (background)
cd apps/worker && set -a && . ./.env.local && set +a && npx tsx src/index.ts &

# Web server
cd apps/web && pnpm dev

# Verify services
redis-cli ping
psql ai_digest_dev -c "SELECT 1"
curl -s http://localhost:3000/api/health | jq .success
```

---

## Security (8 rules)

### L1-S1: Server-Side Authorization

All admin operations require `requireAdminFromRequest()` check. Client-side role display is allowed but authorization must be server-side only.

### L1-S2: Input Validation with Zod

All request bodies validated with Zod schemas. Use `safeParse()` for explicit handling. Catch `ZodError` separately from other errors. Return `{ success: false, error, details: error.issues }` on validation failure.

### L1-S3: No Hardcoded Secrets

Never commit `.env.local` or files containing API keys, passwords, or tokens. Use `.env.example` for documentation with placeholder values only. All secrets loaded from environment variables.

### L1-S4: Parameterized Queries Only

All database queries use Drizzle ORM operators (`eq`, `and`, `or`, `gte`, `desc`). Never construct SQL strings with user input. Use `sql` template tag for complex queries — placeholders are auto-parameterized.

### L2-S5: Rate Limiting on Public Endpoints

Apply `applyRateLimit(request, requestsPerWindow, windowMs)` on all public-facing endpoints. Return early if rate limited.

### L2-S6: Security Headers

Add explicit security headers to responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### L2-S7: Error Messages Must Not Leak Internals

Generic error messages for users (e.g., "Invalid email or password"). Detailed errors only in server logs. Health endpoints return minimal status, not configuration metadata.

### L2-S8: Strict Zod Schemas

Avoid `z.unknown()` in schemas. All object properties must have explicit types. `z.record()` requires strict value types.

---

## Architecture (7 rules)

### L1-A1: API Response Contract

All routes return standardized format:

```typescript
{ success: boolean; data?: T; error?: string; meta?: { total?: number; page?: number; limit?: number } }
```

- Success: `status: 200`, `success: true`, include `data`
- Validation error: `status: 400`, `success: false`, include `error` + `details`
- Auth error: `status: 401`, `success: false`
- Server error: `status: 500`, `success: false`

### L1-A2: Unidirectional Package Dependencies

```
shared (0 deps) <- db <- agents <- apps (web/worker)
                      <- podcast
                      <- email
```

No circular dependencies. Import via `@ai-digest/package`, never relative paths across package boundaries. Consumer packages must list their own `drizzle-orm` dependency.

### L2-A3: Database Query Organization

All queries in `packages/db/src/queries/*.ts`. Export namespace: `export * as queries from "./queries"`. Every query is an async function with `db: Database` as first parameter. Schema types via `typeof table.$inferInsert` / `.$inferSelect`.

### L2-A4: Worker Processor Pattern

Processors accept `Job<Data>` from BullMQ. Use callback factory pattern for observability. Track stage progress: `onStageStart` -> `onStageComplete` / `onStageFail`. Sequential chaining: pipeline -> podcast -> newsletter.

### L2-A5: JSONB Type Safety

All JSONB columns have `.$type<T>()`. Types imported from `@ai-digest/shared`. Non-nullable JSONB includes `.notNull()`.

### L2-A6: Pagination Standard

```typescript
const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "10")))
const offset = (page - 1) * limit
// Return: { items, pagination: { page, limit, total, totalPages } }
```

### L3-A7: Turbo Build Dependencies

`^build` means build all upstream packages first. Dev tasks are non-cached persistent. Build outputs cached for CI.

---

## Code Quality (7 rules)

### L1-Q1: Naming Conventions

- **PascalCase**: Types, interfaces, classes (`PipelineResult`, `BudgetTracker`)
- **camelCase**: Functions, variables, methods (`fetchRss`, `generateSegmentAudio`)
- **CONSTANT_CASE**: Module-level constants (`BATCH_SIZE`, `MAX_RETRIES`)
- **verb+noun**: Function names (`runCategorize`, `buildPrompt`, `parseScript`)

### L1-Q2: Import Ordering

Three groups separated by blank lines:
1. External libraries (`@anthropic-ai/sdk`, `bullmq`, `ioredis`)
2. Internal packages (`@ai-digest/shared`, `@ai-digest/db`)
3. Local modules (`./prompts`, `../lib/session`)

Within each group, `import type` before value imports.

### L1-Q3: Error Handling

Always use try-catch with typed error narrowing (`error instanceof Error`). Include source context in error messages (e.g., `[RSS]`, `ElevenLabs TTS`). Throw errors with descriptive messages, never bare errors. In optional operations, log and continue; in critical paths, throw.

### L2-Q4: Immutability

Never mutate objects or arrays. Use spread operator (`{...obj}`, `[...arr]`) for updates. Mark constant collections with `Readonly<>`. Use `const` with reassignment for accumulators.

### L2-Q5: TypeScript Strict Mode

Enforce `strict: true` with `noUncheckedIndexedAccess: true`. Use nullish coalescing (`??`) for defaults. Apply non-null assertions (`!`) only after guaranteed operations (`.returning()[0]!` after INSERT). Always type-narrow after `.find()` calls.

### L2-Q6: Function Size

Keep functions under 120 lines. Max 2 levels of nesting. Each function does ONE thing. Extract loops and conditionals into named helper functions when complex.

### L2-Q7: File Organization

Organize: (1) imports, (2) constants/types, (3) classes/main functions, (4) helpers. Keep files 150-400 lines; extract to new files if growing past 400. Each stage/fetcher is its own file.

---

## Skill Invocation (2 rules)

### L1-SK1: Relevant Skills Must Be Invoked

On every prompt, evaluate available skills and invoke any that are relevant to the task at hand. This includes but is not limited to:

- `gate-validation-discipline` for validation gates
- `functional-validation` for validation methodology
- `agent-browser` or Playwright MCP for frontend testing
- `frontend-ui-ux` for UI/component work
- `autopilot` / `ultrawork` / `ralph` for execution modes
- Domain-specific skills matching the current task

### L2-SK2: Gate Validation Discipline

Always invoke `/gate-validation-discipline` when completing implementation phases. Never skip validation gates. Evidence must be captured and verified before advancing to next phase.

---

## Level Summary

| Level | Count | Enforcement |
|-------|-------|-------------|
| L1 (Must) | 14 | Block completion if violated |
| L2 (Should) | 13 | Warn, require justification to skip |
| L3 (May) | 1 | Advisory |

**Total: 28 rules across 5 categories**
