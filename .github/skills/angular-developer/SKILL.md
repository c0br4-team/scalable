---
name: angular-developer
description: 'Use when building, reviewing, or refactoring Angular apps. Covers version-aware guidance, CLI workflows, components, signals, forms strategy, DI, routing, styling, testing, accessibility, and production readiness checks.'
argument-hint: 'What Angular feature or workflow do you want help with?'
---

# Angular Developer Guidelines

## Goal

Use this skill for practical, implementation-ready Angular development guidance across app setup, feature development, testing, and verification.

## Core Rules

1. Always determine Angular version first for project-specific work. Prefer version-aware guidance because APIs and best practices evolve quickly.
2. Prefer Angular CLI scaffolding (`ng generate`) for components, services, directives, pipes, guards, and routes to keep consistency.
3. Follow Angular style guide and maintainability defaults (clear boundaries, typed APIs, minimal side effects).
4. After generating or modifying code, run a build check (`ng build`) and resolve errors before considering the task complete.

## Workflow

### 1. Identify project context

- Existing Angular project: inspect workspace and Angular version before advising or editing.
- New project request: use the command-selection rules in "Creating New Projects".
- Non-Angular workspace: clarify whether the user wants a new Angular app scaffolded.

### 2. Pick the smallest fitting subsystem

- Components: UI composition and template behavior.
- Signals and reactivity: local state, derived state, and async data.
- Forms: signal forms, reactive forms, or template-driven forms based on app constraints.
- Routing: URL-driven navigation, guards, resolvers, lazy loading, render strategy.
- Dependency Injection: shared behavior, service architecture, provider scopes.
- Styling and animations: component styles, design systems, CSS-first animations.
- Testing: unit, routing, harness, and E2E strategy.

### 3. Implement with version-aware conventions

- Favor modern Angular patterns that match the project version.
- Preserve existing architecture and conventions in established codebases.
- Use standalone-first patterns unless the project intentionally uses NgModule-heavy structure.

### 4. Verify quality before completion

- Build passes.
- Relevant tests pass or are updated.
- Accessibility, performance, and error handling are considered.
- New code aligns with existing folder structure and naming conventions.

## Creating New Projects

If no user constraints are provided, default to latest stable Angular.

For new forms in fresh apps, prefer Signal Forms when Angular version supports it (Angular 21+).

### CLI command decision tree

1. If user asks for a specific Angular version, use `npx` with pinned CLI:
   - `npx @angular/cli@<requested_version> new <project-name>`
2. If no specific version is requested, check local/global CLI:
   - Run `ng version`
   - If available, run `ng new <project-name>`
3. If `ng version` is unavailable or fails, use latest via `npx`:
   - `npx @angular/cli@latest new <project-name>`

## Components

When implementing components, prioritize:

- Clear component boundaries and focused responsibilities.
- Modern template control flow (`@if`, `@for`, `@switch`) when supported.
- Signal-based input and output patterns when appropriate.
- Host binding patterns that keep component API predictable.

If needed, consult:

- https://angular.dev/guide/components

## Reactivity and Data Management

Prefer Angular Signals for component-local and feature-local reactivity.

Use:

- `signal` for writable state.
- `computed` for derived state.
- `linkedSignal` when writable state depends on upstream signal state.
- `resource` for async loading into reactive state when suitable.
- `effect` for side effects only, not as a primary data propagation mechanism.

## Forms

Choose form strategy based on project state and complexity:

- Angular 21+ and new forms: prefer Signal Forms.
- Existing app already using reactive forms: stay consistent unless migrating intentionally.
- Template-driven forms: simple forms with minimal dynamic behavior.
- Reactive forms: complex validation, dynamic controls, or advanced workflows.

## Dependency Injection

Follow DI best practices:

- Prefer `inject()` in modern Angular contexts when it improves readability.
- Default shared services to `providedIn: 'root'` unless narrower scope is required.
- Use `InjectionToken` for abstractions and config objects.
- Choose provider scopes deliberately (`EnvironmentInjector` vs element-level providers).

## Routing

Use routing as the backbone for feature navigation:

- Define routes with explicit static, dynamic, wildcard, and redirect behavior.
- Prefer lazy loading for feature boundaries and bundle efficiency.
- Use guards (`CanActivate`, `CanMatch`) for access control.
- Use resolvers for route-prefetch requirements.
- Choose rendering mode (CSR, SSR, SSG) based on product goals.
- Consider route transitions with View Transitions where UX benefits.

If needed, consult:

- https://angular.dev/guide/routing

## Styling and Animations

- Keep styling local to components unless global theming is needed.
- Prefer CSS-first animations; use legacy Angular animation DSL only when required.
- Integrate Tailwind thoughtfully when it matches team standards.

## Testing

When adding or editing tests:

- Use the project's existing test framework and patterns.
- Prioritize meaningful behavior tests over implementation-coupled tests.
- Use harness-based and router-aware testing patterns where they improve reliability.
- Keep E2E coverage focused on critical user journeys.

## Tooling

- Use Angular CLI for generate/build/serve/test workflows.
- Use language tooling and diagnostics before finalizing code.
- Keep dependencies updated with intentional upgrades and migration notes.

## Completion Checks

A task is complete only when all applicable checks pass:

- Angular version was considered in guidance or implementation.
- Chosen subsystem (components, forms, routing, signals, DI) fits the problem.
- Code follows established project structure and style conventions.
- Build verification completed and errors resolved.
- Relevant tests were added/updated or a justified test gap is documented.
- Accessibility and user-facing error states were not ignored.

## Example Prompts

- Add a standalone feature route with lazy loading and guard protection.
- Create a signal-driven form for profile editing and validation.
- Refactor this component to signals and modern template control flow.
- Build a route resolver for case details and handle loading/errors.
- Help me scaffold a new Angular app with the right CLI command.
- Review this Angular PR for architecture, maintainability, and test gaps.

## Source Mapping

This skill is based on the Angular community skill at:

- https://skills.sh/angular/skills/angular-developer

Use official Angular docs as final authority for API syntax and version behavior:

- https://angular.dev
