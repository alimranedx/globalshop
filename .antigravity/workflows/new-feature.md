# Development Workflow: New Feature

Follow this 8-phase workflow for every new feature:

## Phase 1 — Read
- Read `.antigravity/AGENTS.md` and `.antigravity/memory/project-memory.md`
- Read relevant feature instructions in `.antigravity/instructions/`
- Inspect existing related controllers, models, and routes

## Phase 2 — Analyze
- Identify models, database tables, middleware, and policies affected
- Check tenant isolation requirements & permission matrix impact
- Identify regression risks

## Phase 3 — Plan
- Create an implementation plan detailing backend, frontend, database, and test changes
- Obtain approval if architectural changes are required

## Phase 4 — Implement
- Implement logic following GlobalShop coding standards
- Extend existing services/modules rather than creating duplicate utilities

## Phase 5 — Test
- Run `php artisan test`
- Verify positive & negative permission scenarios and cross-shop isolation

## Phase 6 — Review
- Audit code for security, IDOR vulnerabilities, N+1 queries, and performance

## Phase 7 — Update Memory
- Record any permanent business rules or architectural decisions in `.antigravity/memory/`

## Phase 8 — Final Verification
- Verify build (`npm run build`) and test suite cleanly pass
