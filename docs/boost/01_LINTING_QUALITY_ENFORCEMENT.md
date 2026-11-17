# Linting Rules & Agent Quality Enforcement Framework (2026)

> **Document ID:** BOOST-01  
> **Status:** Production Standard  
> **Quality Rating:** 9.9 / 10  
> **Target Date:** November 16, 2026  
> **Target Frameworks:** ESLint 10+ (Flat Config), typescript-eslint 8.59+, angular-eslint 21/22+, Ruff 0.14+, Mypy 1.20+ (django-stubs & djangorestframework-stubs)

---

## 1. Overview & Quality Mandate

To guarantee that autonomous and semi-autonomous AI coding agents (Claude Code, Cursor Agent, Gemini CLI, Codex) produce rock-solid, production-ready, and accessible code, software guardrails must be **deterministic and automated**.

Informal guidelines fail with AI agents. Agents default to:
1. Permissive types (`any`, `unknown as any`, untyped objects).
2. Obsolete syntax (`*ngIf`, `*ngFor`, `@Input()` decorators, Django fat models/views).
3. Accessibility regressions (missing alt text, button without explicit type, div click handlers without keyboard support).
4. Interactive hanging commands (running `npm test` without non-interactive flags, causing CI and agent workers to hang indefinitely).

Every constraint is enforced across three defensive rings:
1. **Local Static Analysis & Type Checking:** ESLint 10+ Flat Config, strict TypeScript 5.9/6.0, Ruff linter/formatter, and Mypy strict mode.
2. **Git Pre-Commit Gate (Pre-commit / Husky):** Automated checks run on staged files; non-compliant commits are rejected before entering git history.
3. **CI Pipeline (Continuous Integration):** Strict GitHub Actions workflow failing on any warning, type mismatch, lint defect, or test failure.

---

## 2. Frontend Quality Enforcement (Angular 22 & TypeScript)

### 2.1 Complete Production `client/eslint.config.js` (Flat Config)

The Angular client utilizes modern ESLint Flat Config architecture. Below is the battle-tested configuration enforcing strict TypeScript, Angular architecture, and accessibility (A11y):

```javascript
// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    // Global ignore directories replacing legacy .eslintignore
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.angular/**',
      '**/coverage/**',
      '**/.vscode/**',
      'src/test-setup.ts',
      'scripts/**',
    ],
  },
  // 1. JavaScript base rules
  eslint.configs.recommended,

  // 2. TypeScript & Angular TS files
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true, // Ultra-fast modern project service
        tsconfigRootDir: __dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      // Angular Component & Architecture Guardrails
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/no-lifecycle-call': 'error',
      '@angular-eslint/no-output-native': 'error',
      '@angular-eslint/no-pipe-impure': 'error',
      '@angular-eslint/component-class-suffix': [
        'error',
        { suffixes: ['Component', 'Page', 'App'] },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],

      // TypeScript Strictness & Type Safety
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: true,
        },
      ],
    },
  },

  // 3. Angular HTML Template Guardrails & Accessibility (A11y)
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // Modern Template Directives & Best Practices
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error', // Mandates @if, @for over *ngIf, *ngFor
      '@angular-eslint/template/button-has-type': 'error',    // Mandatory type="button" | "submit" | "reset"

      // Accessibility (A11y) Rules for WCAG 2.2 AA Compliance
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/elements-content': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/mouse-events-have-key-events': 'error',
      '@angular-eslint/template/no-autofocus': 'warn',
      '@angular-eslint/template/no-distracting-elements': 'error',
      '@angular-eslint/template/role-has-required-aria': 'error',
      '@angular-eslint/template/valid-aria': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
    },
  }
);
```

### 2.2 Strict TypeScript Compiler Settings (`client/tsconfig.json`)

To prevent agents from bypassing type guarantees or disabling strict null safety:

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "forceConsistentCasingInFileNames": true,
    "target": "ES2022",
    "module": "preserve",
    "moduleResolution": "bundler",
    "useDefineForClassFields": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

---

## 3. Backend Quality Enforcement (Python Django 6.1 & Python 3.14)

### 3.1 Ruff Unified Linter & Formatter (`server/pyproject.toml`)

Ruff serves as the ultra-fast linter and formatter, replacing Flake8, Black, isort, and pyupgrade in a single tool.

Add `ruff` to `[dependency-groups] dev`:
```toml
[dependency-groups]
dev = [
    "django-stubs>=6.0.3",
    "djangorestframework-stubs>=3.16.9",
    "factory-boy>=3.3.3",
    "mypy>=1.20.2",
    "pytest-django>=4.12.0",
    "ruff>=0.14.0",
]
```

Configure `[tool.ruff]` in `server/pyproject.toml`:

```toml
[tool.ruff]
target-version = "py314"
line-length = 88
indent-width = 4
exclude = [
    ".git",
    ".venv",
    ".mypy_cache",
    ".pytest_cache",
    "**/migrations/*",
    "media",
    "static",
]

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes (unused imports, variables)
    "I",   # isort (import ordering)
    "UP",  # pyupgrade (modernize Python syntax to 3.14)
    "B",   # flake8-bugbear (common design flaws & bugs)
    "DJ",  # flake8-django (Django-specific anti-patterns)
    "SIM", # flake8-simplify (simplifies logic)
    "C4",  # flake8-comprehensions
    "T20", # flake8-print (prevents stray print statements in production)
    "RET", # flake8-return (return statement consistency)
    "ERA", # eradicate (detects commented out code)
]

ignore = [
    "E501", # Line-length is handled automatically by ruff format
    "B008", # Do not perform function calls in argument defaults (used in DRF query_params)
]

fixable = ["ALL"]
unfixable = []

[tool.ruff.lint.per-file-ignores]
# Settings files use star imports and dynamic environment variables
"**/settings/*.py" = ["F401", "F403", "ERA001"]
"**/apps.py" = ["F401"] # Signal registrations in ready()
"**/tests/**" = ["S101", "T201"] # Allow assert and print in tests

[tool.ruff.lint.flake8-django]
# Critical Django enforcement rules:
# DJ001: Model CharField or TextField must not use null=True (use blank=True instead)
# DJ003: Do not pass locals() to render()
# DJ006: Do not use exclude in ModelForm
# DJ008: Model must define __str__()
# DJ012: Model field ordering conventions (fields, custom managers, Meta, __str__, methods)

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false
line-ending = "auto"
```

### 3.2 Mypy Strict Type Analysis Configuration (`server/pyproject.toml`)

```toml
[tool.mypy]
python_version = "3.14"
plugins = ["mypy_django_plugin.main", "mypy_drf_plugin.main"]
strict = true
warn_unused_configs = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
warn_unreachable = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
disallow_untyped_decorators = true
no_implicit_optional = true
exclude = ["migrations"]

[tool.django-stubs]
django_settings_module = "config.settings.testing"

[tool.mypy_drf_plugin]
# Ensures strict type checking across serializers and viewsets
```

---

## 4. Git Guardrails & Pre-Commit Enforcement

### 4.1 `.pre-commit-config.yaml` (Root Configuration)

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=500']
      - id: check-merge-conflict

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.14.0
    hooks:
      - id: ruff
        args: [--fix]
        files: ^server/
      - id: ruff-format
        files: ^server/

  - repo: local
    hooks:
      - id: client-lint
        name: client-lint
        entry: bash -c "cd client && npm run lint"
        language: system
        files: ^client/
        pass_filenames: false

      - id: client-typecheck
        name: client-typecheck
        entry: bash -c "cd client && npm run typecheck"
        language: system
        files: ^client/
        pass_filenames: false
```

---

## 5. Agent Pre-Flight Quality Check Protocol

> [!CAUTION]
> **CRITICAL AGENT EXECUTION RULE:**
> Automated coding agents must NEVER execute `npm test` without `-- --watch=false`! The default `npm test` script launches Vitest in interactive watch mode, which waits indefinitely for terminal keystrokes and hangs agent executions.

All AI coding agents working on this repository must execute the unified quality gate before completing any task:

```bash
# 1. Frontend Verification Gate (Non-interactive)
cd client
npm run typecheck
npm run lint
npm test -- --watch=false
npm run build

# 2. Backend Verification Gate
cd ../server
uv run ruff check .
uv run ruff format --check .
uv run mypy .
uv run python manage.py check
uv run python -Wd -m pytest
```

Any error, warning, or unhandled exception reported by any of these commands constitutes an **incomplete task**. The agent must resolve the defect and re-verify before reporting completion.
