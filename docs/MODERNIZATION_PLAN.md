# react-tracking v10.0.0 Modernization Plan

We are taking over maintenance of react-tracking (originally by the NY Times engineering team, currently v9.3.2). The repo has been abandoned — key dependencies (Enzyme, Node 14/16, ESLint 8, Prettier 2, React 16 test target, Babel build) are EOL or deprecated.

All changes preserve the existing public API surface: `track` (as HOC, not `@decorator`), `useTracking`, `withTracking`, `trackEvent`, `TrackingPropType` (converted to TS type export), and the `deepmerge` re-export. The legacy `@track()` decorator syntax is removed — this is an intentional v10 breaking change.

---

## 1. Build Pipeline

| Before                             | After                      |
| ---------------------------------- | -------------------------- |
| Babel CLI                          | Vite 8 library mode        |
| CJS-only output (`build/index.js`) | ESM only (`dist/index.js`) |
| No sourcemaps in package           | Sourcemaps included        |

- `@vitejs/plugin-react` — no Babel decorator plugins needed (legacy `@track()` decorator syntax removed)
- Vite 8 uses **Rolldown** (not Rollup) as its production bundler — do not use any `@rollup/*` plugins; `@vitejs/plugin-react@^6` optionally peer-depends on `@rolldown/plugin-babel`
- `package.json`: add `"type": "module"`, `exports` field, `"sideEffects": false`, modern ESM-only exports
- Output directory changes from `build/` to `dist/`
- **CJS output is intentionally dropped** — ESM only is the v10 contract

## 2. TypeScript Rewrite

- Convert all `src/*.js` → `src/*.ts` (and `.tsx` where JSX is used)
- Ship built-in `.d.ts` declarations — no more relying on `@types/react-tracking`
- `tsconfig.json`: strict mode, React 19 JSX transform
- `vite-plugin-dts` to emit declarations during build

## 3. Linting & Formatting

| Before                           | After          |
| -------------------------------- | -------------- |
| ESLint 8 + airbnb + babel-parser | oxlint         |
| Prettier 2                       | oxfmt          |
| Husky 8                          | Husky 9        |
| lint-staged 13                   | lint-staged 16 |

- `oxlint` — npm package `oxlint`, drop-in linter from the oxc project
- `oxfmt` — npm package `oxfmt`, 30x faster than Prettier, 100% JS/TS Prettier conformance
  - CLI: `oxfmt .` to format, `oxfmt --check .` for CI
  - Supports `--migrate prettier` to convert existing config
- Delete: `.eslintrc.js`, `.prettierrc.json`, `src/__tests__/.eslintrc`, all `eslint-*` and `prettier` deps

## 4. Testing

| Before                                | After                                           |
| ------------------------------------- | ----------------------------------------------- |
| Jest 29                               | Vitest ^4                                       |
| Enzyme 3 + React 16 adapter           | React Testing Library (latest as of March 2026) |
| React 16 devDep                       | React 19 devDep                                 |
| `raf-polyfill`, `regenerator-runtime` | Not needed                                      |

### Key migration patterns

| Enzyme / Jest                              | RTL / Vitest                                  |
| ------------------------------------------ | --------------------------------------------- |
| `mount(<Comp />)`                          | `render(<Comp />)`                            |
| `wrapper.find('button').simulate('click')` | `fireEvent.click(screen.getByRole('button'))` |
| `jest.fn()`                                | `vi.fn()`                                     |
| `jest.mock()` / `jest.setMock()`           | `vi.mock()` with factory                      |
| `wrapper.setProps({ x: 1 })`               | `rerender(<Comp x={1} />)`                    |
| `wrapper.childAt(0).instance()`            | Test via behavior, not internals              |
| `act()` from `react-dom/test-utils`        | `act()` from `react`                          |
| `shallow()`                                | `render()` (no shallow equivalent)            |

### Test files to migrate

| File                                     | Lines | Notes                                                 |
| ---------------------------------------- | ----- | ----------------------------------------------------- |
| `e2e.test.js`                            | 1000  | Decorator syntax, class components, "built lib" check |
| `hooks.test.js`                          | 1016  | All functional components, no decorators              |
| `withTrackingComponentDecorator.test.js` | 275   | Decorators, `shallow()` usage                         |
| `trackEventMethodDecorator.test.js`      | 283   | Plain class tests (no React rendering)                |
| `trackingHoC.test.js`                    | 50    | `jest.setMock`, decorators                            |
| `useTracking.test.js`                    | 56    | `mount`, `renderToString`                             |
| `makeClassMemberDecorator.test.js`       | 48    | Plain class tests (no React rendering)                |
| `index.test.js`                          | 29    | Export checks                                         |
| `dispatchTrackingEvent.test.js`          | 41    | Pure JS, no React                                     |

## 5. React 18 + 19 Source Changes

- Remove **all** `PropTypes` runtime usage — `prop-types` package is fully dropped
  - `withTrackingComponentDecorator`: remove `PropTypes` import, `propTypes` static, and `defaultProps`
  - `TrackingPropType.ts`: rewrite as a pure TS type/interface export (no runtime `PropTypes.shape`)
- **`forwardRef` compat for React 18 + 19**: In React 19, `ref` is a regular prop and `forwardRef` is a no-op. In React 18, `forwardRef` is still required. Strategy:
  - Keep `React.forwardRef` wrapper — it works on both 18 and 19
  - Remove the synthetic `rtFwdRef` indirection: the `forwardRef` render function receives `(props, ref)` directly, pass `ref` through as a prop
  - This is forward-compatible: when React 18 support is eventually dropped, the `forwardRef` wrapper can be trivially removed
- Remove default `React` imports — use named imports only (`import { createContext } from 'react'`, etc.) for the new JSX transform
- Drop the legacy context interop test (`contextTypes` / `childContextTypes` / `getChildContext` removed in React 19)
- Update e2e "built lib" check path from `../../build` to `../../dist`

## 6. CI & Config

| File                          | Change                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `.github/workflows/node.yaml` | Node matrix → 22.x, 24.x (Current); `actions/checkout@v4`; `actions/setup-node@v4`; `pnpm install` |
| `.nvmrc`                      | `v18` → `v22`                                                                                      |
| `.npmignore`                  | Exclude `src/`, include `dist/`                                                                    |
| `tsconfig.json`               | Strict mode, `jsx: "react-jsx"`, emit declarations                                                 |

## 7. package.json Summary

### Dependencies

- `deepmerge@^4.3.1` (minor bump from `^4.2.2`)
- `hoist-non-react-statics@^3.3.2` (unchanged)

### Peer dependencies

- `react: ^18.0.0 || ^19.0.0` (add React 19, drop older than 18)
- `prop-types` → **removed entirely** (replaced by TS type exports)

### Dev dependencies (new)

- `@testing-library/jest-dom`, `@testing-library/react`
- `@vitejs/plugin-react`
- `husky@^9`, `lint-staged@^16`
- `jsdom`
- `oxlint`, `oxfmt`
- `react@^19`, `react-dom@^19`
- `typescript@^6`
- `vite@^8`, `vitest@^4`
- `vite-plugin-dts`

### Dev dependencies (removed)

All `@babel/*`, `babel-plugin-transform-decorators-legacy`, `enzyme`, `enzyme-adapter-react-16`, all `eslint*`, `prettier`, `jest`, `jest-environment-jsdom`, `prop-types`, `raf-polyfill`, `react-test-renderer`, `regenerator-runtime`

### Other `package.json` changes

- `"engines": { "node": ">=22" }` — remove `npm` constraint (project uses pnpm)
- Remove `optionalDependencies.fsevents` (macOS dev concern, not a library concern)
- Preserve `"sideEffects": false` for tree-shaking

---

## Execution Strategy

### Phase 1 (sequential — both touch `package.json`)

| Step | Agent       | Task                                                                |
| ---- | ----------- | ------------------------------------------------------------------- |
| 1a   | **Agent 1** | TS rewrite + Vite build config + `package.json` structure           |
| 1b   | **Agent 5** | Config & CI (oxlint, oxfmt, husky, GH Actions) — runs after Agent 1 |

### Phase 2 (parallel, after Phase 1 completes)

| Agent       | Task                                                     | Depends on |
| ----------- | -------------------------------------------------------- | ---------- |
| **Agent 2** | Rewrite `hooks.test` (1016 lines) → Vitest + RTL         | Phase 1    |
| **Agent 3** | Rewrite `e2e.test` (1000 lines) → Vitest + RTL           | Phase 1    |
| **Agent 4** | Rewrite 7 smaller test files (~500 lines) → Vitest + RTL | Phase 1    |

### Phase 3 (sequential)

- Merge all worktrees
- Resolve any conflicts
- `pnpm install` → `vite build` → `vitest run`
- Format everything with `oxfmt .`
- Verify clean `oxlint ./src`

## 8. Review Decisions Log

Issues found during plan review and their resolutions (March 2026).

| #   | Issue                                        | Decision                                                                                                                                                                                                                     |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | §1 garbled sentence re: `@track()` decorator | **Remove the legacy `@decorator` syntax**. The `track` HOC call form (`track(data)(Component)`) is preserved; only the Babel-dependent `@track()` class decorator is dropped. Documented as intentional v10 breaking change. |
| 2   | ESM-only drops CJS consumers                 | **ESM only. CJS is intentionally dropped.** Documented as v10 breaking change.                                                                                                                                               |
| 3   | `prop-types` contradictory guidance          | **Remove `prop-types` entirely.** `TrackingPropType` rewritten as a pure TS type/interface. No runtime PropTypes anywhere — they are deprecated and an anti-pattern.                                                         |
| 4   | `React.forwardRef` deprecated in React 19    | **Keep `forwardRef` for React 18 compat**, but remove `rtFwdRef` indirection. Trivially removable once React 18 is dropped.                                                                                                  |
| 5   | Vite 8 uses Rolldown, not Rollup             | **Documented in §1.** No `@rollup/*` plugins.                                                                                                                                                                                |
| 6   | Node 24 is "Current" not LTS                 | Non-issue — included in CI for forward-compat, LTS comes October 2026.                                                                                                                                                       |
| 7   | Phase 1 parallel `package.json` conflict     | **Serialized.** Agent 1 runs first (owns `package.json`), Agent 5 runs after.                                                                                                                                                |
| 8   | `engines` field outdated                     | **Set to `"node": ">=22"`**, remove `npm` constraint (using pnpm).                                                                                                                                                           |
| 9   | `optionalDependencies.fsevents`              | **Removed.** Not relevant for a published library.                                                                                                                                                                           |
| 10  | `deepmerge` mislabeled "unchanged"           | Fixed — heading now says "Dependencies" with inline notes.                                                                                                                                                                   |
| 11  | `sideEffects: false` not mentioned           | Added to §1 and §7 — explicitly preserved.                                                                                                                                                                                   |
| 12  | §5 references `.js` after TS rewrite         | Fixed — §5 now references files without extension (post-rewrite context).                                                                                                                                                    |
| 13  | Unnecessary default `React` imports          | Added to §5 — named imports only for new JSX transform.                                                                                                                                                                      |

---

## Source Files Reference

| File                                    | Purpose                                                               |
| --------------------------------------- | --------------------------------------------------------------------- |
| `src/index.js`                          | Re-exports everything                                                 |
| `src/trackingHoC.js`                    | Main HOC factory — routes to `withTracking` or `trackEvent` decorator |
| `src/withTrackingComponentDecorator.js` | Wraps components with tracking context provider                       |
| `src/trackEventMethodDecorator.js`      | Decorates class methods to dispatch on call                           |
| `src/useTracking.js`                    | React hook API (`useTracking`)                                        |
| `src/useTrackingImpl.js`                | Hook implementation — deepmerge, dispatchOnMount, process             |
| `src/dispatchTrackingEvent.js`          | Default dispatcher (`window.dataLayer.push()`)                        |
| `src/ReactTrackingContext.js`           | `React.createContext({})`                                             |
| `src/TrackingPropType.js`               | PropTypes shape definition                                            |
| `src/makeClassMemberDecorator.js`       | Decorator helper for class members                                    |
