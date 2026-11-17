# AI Agent Skills & Quality Enforcement Guide (2026)

> **Document ID:** BOOST-09  
> **Status:** Production Standard  
> **Quality Rating:** 9.9 / 10  
> **Ecosystem:** Agent Skills Protocol (`skills.sh`), Progressive Disclosure, Downloads Skills Library, Subagent Delegation

---

## 1. What Are Agent Skills? (Progressive Disclosure)

An **Agent Skill** is a modular, version-controlled package of domain expertise, procedural instructions, and validation scripts designed for AI coding agents.

Rather than cluttering system prompts with thousands of lines of instructions (which induces hallucinations and degrades model reasoning), modern agents follow the principle of **Progressive Disclosure**:
1. **Discovery (Low Context Footprint):** At startup, the agent loads only the lightweight metadata (name and one-line description) of available skills.
2. **Activation (On-Demand Loading):** When a user task or command matches a skill's activation trigger (e.g., `/unslop-website`, `/angular-feature`), the agent reads the complete `SKILL.md` into context.
3. **Execution & Validation:** The agent strictly follows the step-by-step procedure and verifies its output using local tooling before completing the turn.

---

## 2. Leveraging the Local Skills Library (`/home/mahmoud-ahmed/Downloads/skills`)

Our local environment at `/home/mahmoud-ahmed/Downloads/skills` contains an extraordinary catalog of battle-tested agent skills:

| Suite / Directory | Key Skills | Applied Project Role |
|---|---|---|
| **`superpowers/`** | `subagent-driven-development`<br>`dispatching-parallel-agents`<br>`writing-plans`<br>`executing-plans`<br>`verification-before-completion`<br>`systematic-debugging` | **Core Agent Orchestration:** Directs subagents with isolated scopes, executes phased plans, and enforces non-negotiable verification gates before declaring tasks done. |
| **`matt-pocock/`** | `setup-pre-commit`<br>`codebase-design`<br>`domain-modeling`<br>`tdd`<br>`code-review` | **TypeScript & Architecture Guardrails:** Pre-commit hooks, domain data models, strict TypeScript safety, and peer code review standards. |
| **`addy-osmani/`** | `performance-optimization`<br>`security-and-hardening`<br>`spec-driven-development`<br>`observability-and-instrumentation` | **Engineering Rigor:** Core Web Vitals, image optimization (`NgOptimizedImage`), rate-limiting, and PCI-DSS compliance. |
| **`new/unslop-website/`** | `unslop` | **Design & Aesthetics:** 5-line product direction, 9-pass redline polish, elimination of purple glows, emojis, and AI slop tells. |
| **`shadcn-improve/`** | `improve` | **Component System Polish:** Fine-tuning Spartan UI Helm primitives to guarantee accessibility, keyboard navigation, and consistent micro-interactions. |
| **`andrej-karpathy/`** | `karpathy-guidelines` | **Lean Engineering Tenets:** Ruthless minimalism, verifiable empirical feedback, eliminating speculative abstractions. |
| **`caveman/`** | `safe-refactor`<br>`surgical-patch`<br>`verify-and-stop` | **Safe Code Modifications:** Prevents sweeping unnecessary rewrites; ensures small, high-signal, test-verified diffs. |
| **`tstack/`** | `modernize` | **Full-Stack Upgrades:** Upgrading Angular and Django conventions to current standards without breaking existing test suites. |

---

## 3. The `skills.sh` CLI Registry Integration

Skills can be managed globally or at project-level via the official `skills` CLI:

```bash
# 1. Search for skills in the global registry
npx --yes skills find tailwind
npx --yes skills find angular
npx --yes skills find unslop

# 2. Add a skill package to .agents/skills/
npx --yes skills add vercel-labs/agent-skills --agent * -y

# 3. List installed skills
npx --yes skills list

# 4. Deterministic restoration via lockfile (CI & new developer machines)
npx --yes skills experimental_install --frozen-lockfile
```

---

## 4. Subagent Delegation Architecture (Aggressive Parallelism)

When executing large refactoring plans or multi-domain features, the primary agent must delegate tasks to **specialized subagents with clear, bounded contexts**:

```
                        +----------------------------+
                        |     Lead / Parent Agent    |
                        |   (Orchestrator & Auditor) |
                        +----------------------------+
                                      |
         +----------------------------+----------------------------+
         |                            |                            |
         v                            v                            v
+------------------+         +------------------+         +------------------+
| Frontend Subagent|         | Backend Subagent |         |  Design Subagent |
| Context: client/ |         | Context: server/ |         | Context: Unslop  |
| - Angular 22     |         | - Django 6.1     |         | - 9-Pass Polish  |
| - Spartan Helm   |         | - Service Layer  |         | - Tailwind v4    |
| - Signals State  |         | - Async ORM      |         | - Typography     |
+------------------+         +------------------+         +------------------+
```

### Delegation Rules for Subagents:
1. **Isolated Context:** Provide each subagent with only the relevant directory paths, API contracts, and document IDs.
2. **Deterministic Completion Requirement:** Every subagent must run its local verification command (e.g. `npm test -- --watch=false` or `uv run pytest`) and output proof of success.
3. **No Premature Exit:** Subagents must resolve any failing test or lint error before handing work back to the parent.

---

## 5. Custom Project Skills for This Repository

To guarantee that agents follow our November 2026 stack conventions, four custom skills are defined in the workspace:

### 5.1 Skill: `/angular-feature`
**Trigger:** Scaffolding or refactoring any client-side feature.  
**Procedure:**
1. Generate components via Angular CLI with `ChangeDetectionStrategy.OnPush`.
2. Do **NOT** emit `standalone: true` (it is default in Angular v20+).
3. Implement state using `signal()`, `computed()`, and `linkedSignal()`.
4. Use Spartan UI directives (`hlmBtn`, `hlmInput`, `HlmSheet`) instead of ad-hoc custom wrappers.
5. Use native control flow (`@if`, `@for (...; track ...)`).
6. Validate via `npm run typecheck && npm run lint && npm test -- --watch=false`.

### 5.2 Skill: `/django-service`
**Trigger:** Scaffolding or modifying backend domain logic.  
**Procedure:**
1. Keep `models.py` strictly focused on schema, check constraints, and indexes.
2. Place all read operations in `selectors.py` using `select_related()` and `prefetch_related()` to eliminate N+1 queries.
3. Place all write/mutation operations in `services.py` decorated with `@transaction.atomic`.
4. Wrap any external API calls with try/except blocks and log failures with structured context.
5. Verify via `uv run ruff check . && uv run mypy . && uv run python -Wd -m pytest`.

### 5.3 Skill: `/unslop-website`
**Trigger:** Designing, refining, or unslopping any user interface.  
**Procedure:**
1. Audit the screen against slop signs (purple gradients, glows, emojis, inconsistent padding).
2. Write the 5-Line Product Direction (Product, Character, World, Moments, Signature).
3. Execute the 9 Passes in order: Spacing, Color, Icons, Copy, Type, Layout, Details, Visuals, Motion.
4. Verify using the unslop checklist.

### 5.4 Skill: `/code-review-gate`
**Trigger:** Any task completion or PR preparation.  
**Procedure:**
Agents must execute and output the results of this non-interactive script:
```bash
#!/usr/bin/env bash
set -e
echo "Running Pre-Flight Quality Gates..."

echo "1/4 Frontend Typecheck & Lint..."
cd client && npm run typecheck && npm run lint

echo "2/4 Frontend Non-Interactive Tests & Build..."
npm test -- --watch=false
npm run build

echo "3/4 Backend Lint & Types..."
cd ../server && uv run ruff check . && uv run ruff format --check . && uv run mypy .

echo "4/4 Backend Check & Tests..."
uv run python manage.py check
uv run python -Wd -m pytest

echo "Quality Gate: ALL 4 CHECKS PASSED WITH ZERO WARNINGS!"
```

---

## 6. Root Agent Rules Configuration (`AGENTS.md`)

The root `AGENTS.md` file acts as the binding contract for all AI coding agents operating on this repository:

```markdown
# Repository Agent Guidelines (E-Commerce 2026)

You are an expert full-stack engineer adhering to Angular 22, Django 6.1, Tailwind v4, and Spartan UI standards as of November 16, 2026.

## Non-Negotiable Engineering Rules:
1. NEVER use the `any` type in TypeScript. Use `unknown` or define an explicit interface.
2. NEVER use `*ngIf`, `*ngFor`, or `*ngSwitch` in templates. Always use `@if`, `@for (item of items; track item.id)`, and `@switch`.
3. NEVER run `npm test` without `-- --watch=false`. Interactive watch mode hangs subagents indefinitely.
4. NEVER place business transactions or external API calls inside Django `models.py` or `views.py`. Always use `services.py`.
5. ALWAYS use Spartan UI primitives (`hlmBtn`, `hlmInput`, `HlmSheet`) for UI elements.
6. ALWAYS write tests covering error cases, edge conditions, and unhappy paths.
7. YOU MUST RUN the pre-flight quality gate (`npm run ci` and `uv run pytest`) before concluding your response.
```
