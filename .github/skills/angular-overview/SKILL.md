---
name: angular-overview
description: "Use when starting Angular work, explaining Angular fundamentals, or deciding which Angular subsystem to use. Based on the official Angular overview, it guides component design, routing, forms, signals, SSR/SSG, tooling, security, i18n, and upgrade habits."
argument-hint: "What Angular topic or workflow do you want to orient around?"
---

# Angular Overview Skill

## Goal

Use this skill to reason about Angular at a high level before making implementation decisions. It turns the official Angular overview into a practical checklist for selecting the right framework features, docs, and architecture patterns.

## Source of truth

Use the official Angular documentation at [angular.dev/overview](https://angular.dev/overview) as the primary reference for Angular concepts, product direction, and feature descriptions.

When a task needs more detail than the overview provides, follow the linked Angular docs for the specific area:

- Components for modular UI structure
- Signals for fine-grained reactivity
- Routing for navigation, guards, and lazy loading
- Forms for validation and user input
- Dependency injection for shared behavior and services
- Server-side rendering and static site generation for delivery strategy
- CLI, DevTools, Language Service, and `ng update` for productivity and maintenance
- Security, accessibility, and internationalization for production readiness

## Angular mental model

Angular is a full framework for building fast, reliable applications that scale with both team size and codebase size. The overview emphasizes these pillars:

- Split the app into components and feature areas.
- Use signals and compile-time optimization for reactive UI updates.
- Choose SSR, SSG, and hydration when rendering strategy matters.
- Share behavior through dependency injection instead of ad hoc coupling.
- Use routing as the navigation backbone for large applications.
- Rely on forms for validation and structured user input.
- Use the CLI, DevTools, and Language Service to move faster.
- Keep apps secure, accessible, internationalized, and up to date.

## Workflow

### 1. Identify the task type

Decide whether the user is asking about:

- App structure or architecture
- UI composition and components
- State and reactivity
- Navigation and routing
- Forms and validation
- Server-side rendering or hydration
- Tooling and upgrade workflow
- Security, accessibility, or internationalization

### 2. Choose the smallest correct Angular concept

Prefer the narrowest feature that solves the problem:

- Use components for isolated UI pieces and feature boundaries.
- Use signals when the problem is local reactive state or derived UI state.
- Use routing when the UI changes by URL or requires guards, resolvers, or lazy loading.
- Use forms when the problem is user input, validation, or form submission.
- Use dependency injection when behavior or data needs to be shared across the app.
- Use SSR or SSG when initial load, crawlability, or delivery strategy matters.

### 3. Validate against production concerns

Before finalizing guidance, check whether the solution must account for:

- Security defaults such as sanitization and safe DOM handling
- Accessibility requirements for interactive UI
- Internationalization or locale formatting
- Upgrade compatibility and `ng update`
- Performance and bundle size
- Developer tooling such as DevTools and Language Service

### 4. Prefer official docs over assumptions

If a request depends on API syntax, new Angular features, or version-specific behavior, consult the relevant Angular documentation instead of relying on memory.

## Decision points

### Components vs services vs routing

- Use a component when the concern is visual composition or a UI interaction boundary.
- Use a service when the concern is shared logic, data access, or cross-cutting behavior.
- Use routing when the concern is page-level navigation, access control, or code splitting.

### Signals vs other state approaches

- Use signals when you need simple, explicit reactive state in Angular.
- Prefer derived values and clear data flow over implicit side effects.
- Keep state local unless there is a real need to share it across features.

### SSR, SSG, or client-only rendering

- Use SSR when you need faster first paint or server-generated HTML.
- Use SSG when the content is mostly static and can be prebuilt.
- Use client-only rendering when the feature is highly interactive and server rendering adds no value.

### Forms

- Use Angular forms for input collection, validation, and submission flow.
- Keep validation rules close to the form model.
- Surface actionable validation feedback to users early.

## Completion checks

A response or implementation guided by this skill should satisfy these checks:

- The chosen Angular concept matches the actual problem.
- The solution is aligned with the official Angular overview and related docs.
- Security, accessibility, and updateability were considered.
- The answer explains why the selected Angular feature is appropriate.
- Any version-sensitive behavior is verified against the docs before being stated as fact.

## Example prompts

- Explain Angular from the official overview.
- Which Angular feature should I use for this UI problem?
- How do components, signals, and routing fit together in Angular?
- When should I use SSR or SSG in Angular?
- What Angular tooling should I use before shipping this change?

## Related follow-up skills

If the task becomes more specific, switch to a narrower skill or doc set for:

- Angular components and templates
- Angular routing
- Angular forms
- Angular SSR and hydration
- Angular CLI and update workflow
- Angular security and accessibility
