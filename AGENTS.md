# AGENTS.md — Lean Agentic Harness

> Universal standard guide for AI agents (AAIF standard). Concise instruction budget (< 100 lines).

## 1. Quick Navigation & Context
- **Full Architecture & Index:** [`docs/context/INDEX.md`](file:///docs/context/INDEX.md)
- **Active Session Handoff:** [`docs/HANDOFF.md`](file:///docs/HANDOFF.md) *(Must read at session start)*
- **Agent Config & Specialists:** [`.agents/AGENTS.md`](file:///.agents/AGENTS.md) | [`.agents/specialists/`](file:///.agents/specialists/)
- **UI Governance & Tokens:** [`docs/ui-governance/token-design.json`](file:///docs/ui-governance/token-design.json)

## 2. Essential Commands
```bash
# Setup & Healthcheck
npm install
npx tsx scripts/kanban.ts ping

# Living Context Sync
npx tsx scripts/kanban.ts context:check
npx tsx scripts/kanban.ts context:push
npx tsx scripts/kanban.ts context:pull

# Kanban Task Execution Lifecycle
npx tsx scripts/kanban.ts publish <path-to-plan.md>
npx tsx scripts/kanban.ts start <cardId>
npx tsx scripts/kanban.ts check <cardId> "Step Description"
npx tsx scripts/kanban.ts review <cardId> --report "Test verification summary"
# (review command enforces automated pre-flight testing gatekeeper)

# UI/UX Studio & Skill Library Sync
npx tsx scripts/kanban.ts component:publish <path-to-template.html>
npx tsx scripts/kanban.ts ui:annotations
npx tsx scripts/kanban.ts skills:list
npx tsx scripts/kanban.ts skills:pull <slug>
```

## 3. Three-Stage Agent Crew Pipeline (Planner → Worker → Checker)
1. **Planner (`agent-orchestration`):** Analyzes domain, builds `docs/context/FEATURE_*.md` with TELOS (Current vs Ideal State), generates task plan.
2. **Worker (`frontend-specialist`, `backend-specialist`, `database-specialist`):** Implements task in an isolated git branch using strict TDD (Red-Green-Refactor).
3. **Checker (`qa-tester` / `security-audit`):** Runs test suites & security scan independently before submitting to Review.

## 4. Hard Guardrails & Constraints ("Never Do")
- **NEVER AUTO-DONE:** Agents are strictly forbidden from moving cards to `Done`. Cards move to `Review` only. Only humans move to `Done`.
- **NEVER CODE ON MASTER:** Direct commits to `master`/`main` are forbidden. Work in feature branches (`feat/...`).
- **NEVER SKIP PRE-FLIGHT TESTS:** All tests must pass 100% before requesting review (`--report` must contain real test logs).
- **NEVER LEAP TO PLAN WITHOUT CONTEXT:** Document `docs/context/FEATURE_*.md` and register in `INDEX.md` before planning tasks.
- **NO LOG CLUTTER:** Maintain single `docs/HANDOFF.md`; do not create timestamped diary log files.

