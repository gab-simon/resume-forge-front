# AGENTS.md

Instructions for agents that write code in this repository. Read this whole file before changing anything.

This project is the front end of Resume Forge, a static React SPA that consumes the FastAPI API of `resume-forge`. Production has no Node server and no SSR. Code and comments are in English. Interface text comes from the locale files in `src/locales`, which exist for English (`en-US`) and Brazilian Portuguese (`pt-BR`).

## Stack

- Bun 1.x as the package manager and script runner
- Node.js 22 or newer for the route generator, Vitest and Playwright (Node 20 fails with `ERR_REQUIRE_ESM`)
- Vite 8 for the build and the development server
- TypeScript 6 in strict mode, with `noUncheckedIndexedAccess`
- React 19
- TanStack Router with file-based routes in `src/routes`
- TanStack Query for all API data
- `@hey-api/openapi-ts` generates the API client in `src/api/generated` from `openapi.json`
- shadcn/ui, Radix and Tailwind CSS 4 for the interface, with icons from `lucide-react`
- React Hook Form and Zod 4 for forms
- i18next and react-i18next for the interface text
- TanStack Table 9 for tables
- Biome for lint and formatting
- Vitest, Testing Library and jsdom for unit tests
- Playwright for E2E tests

Do not add another library without a clear need. If you add one, explain why in your final answer.

## Commands

| Command | What it does |
|---|---|
| `bun install` | Installs the dependencies |
| `bun run dev` | Development server at `http://localhost:5173` |
| `bun run check` | Runs `lint`, `typecheck` and `test`. It is the definition of done |
| `bun run lint` | Biome checks lint and formatting without changing files |
| `bun run lint:fix` | Biome fixes formatting, import order and the lints that have a safe fix |
| `bun run typecheck` | Regenerates `src/routeTree.gen.ts` and runs `tsc --noEmit` |
| `bun run generate-routes` | Regenerates `src/routeTree.gen.ts` from the files in `src/routes` |
| `bun run test` | Unit tests with Vitest |
| `bun run test:e2e` | E2E tests with Playwright, against a mocked API |
| `bun run build` | `typecheck` and the production build in `dist/` |
| `bun run preview` | Serves the contents of `dist/` |
| `bun run fetch-openapi` | Downloads `${VITE_API_URL}/openapi.json` to the repository root |
| `bun run generate-client` | Generates `src/api/generated` from `openapi.json` |
| `bun run analyze` | Production build with a bundle report in `dist/stats.html` |

## Workflow for every change

Follow this order in every task, including small ones.

1. Before writing, read the neighboring code and the features `auth` and `account`. Follow the existing pattern, even if you prefer another one.
2. Make the change together with its tests. New code without a test is not done. The "Tests" section says what each kind of change requires.
3. Run `bun run lint:fix` after editing. It formats the files and sorts the imports. Do not format by hand.
4. Run `bun run check`. It runs `lint`, `typecheck` and `test`, in that order, and stops at the first one that fails. Fix the failure and run it again until it passes.
5. Run `bun run test:e2e` if the change touched a screen, a route, a form, navigation or the layout. The GitHub workflow does not run the E2E tests, so this local run is the only one.
6. Run `bun run build` if the change touched dependencies, `vite.config.ts`, `tsconfig.json`, environment variables or the route structure.
7. In your final answer, list the commands you ran and the result of each one. If a command failed and you could not fix it, show the output. Do not declare the task complete.

A lint, type or test error points to a problem in the code. Fix the cause. Do not disable the rule, do not loosen the type and do not delete the test.

While working, you can run a single file: `bun run test src/features/auth/schemas.test.ts` or `bunx playwright test e2e/auth.spec.ts`. Before finishing, run the whole suite.

## Folder structure

```
openapi.json            API schema. Versioned. It is the input of generate-client
src/
  api/
    generated/          hey-api output. Never edit by hand
    client.ts           Client configuration: base URL and the entry point for auth
    errors.ts           getErrorMessage, which converts API errors into text
  features/
    auth/               Login by email code, session and tokens
    account/            Signed-in user, settings page and user menu
      api/
        queries.ts      Query options and read hooks
        mutations.ts    Write hooks, with cache invalidation
      components/
        index.ts        Public components of the feature
        *.tsx           Components. The ones not listed in index.ts are private
      schemas.ts        Zod schemas for the form and for the search params
      index.ts          Public data API: hooks, query options, schemas, types
  components/
    ui/                 shadcn components. Added by the CLI
    common/             Components shared between features (DataTable, EmptyState, ErrorState)
    layout/             AppShell, sidebar, theme, error and 404 screens
  routes/               TanStack Router routes. One route per file
    __root.tsx          Root route and router context (queryClient)
    _app.tsx            Layout with the sidebar. Files in _app/ render inside it
  hooks/                Generic interface hooks (used by the shadcn components)
  lib/                  Generic utilities: cn(), createQueryClient(), installChunkReloadHandler()
    i18n.ts             Languages, language detection and the i18next configuration
  locales/
    en-US.json          English interface text. The typecheck validates t() keys against it
    pt-BR.json          Brazilian Portuguese interface text, with the same keys
  i18next.d.ts          Types the keys of t() from en-US.json
  config/
    env.ts              Reads and validates the environment variables with Zod
    app.ts              Application name
  test/                 Test utilities: renderWithProviders, mockApi, setup
  main.tsx              Entry point. Configures the client, the QueryClient and the router
e2e/                    Playwright tests and the mocked API (fixtures.ts)
```

Generated files: `src/api/generated/**` and `src/routeTree.gen.ts`. Both are versioned. `dev`, `build`, `test`, `typecheck` and `generate-routes` rewrite `src/routeTree.gen.ts`. After you create, rename or delete a file in `src/routes`, `tsc` reports an error on the route until the file is regenerated. That is why the `typecheck` script regenerates it before checking.

## Architecture rules

1. Never call `fetch` or `axios` directly. Every API call goes through the generated client in `src/api/generated`. Biome rejects `fetch` in `src/` and the `axios` import.
2. Every data access in a component goes through TanStack Query, with the query options and hooks from the feature's `api/` folder. Do not use `useEffect` to fetch data.
3. The data layer cannot depend on the browser. It consists of `src/api/**`, `src/features/*/api/**`, `src/features/*/schemas.ts` and `src/features/*/index.ts`. These files do not import `react-dom`, components, routes, CSS, `sonner`, `lucide-react`, Radix or `@/config/env`, and they do not use `window`, `document`, `localStorage` or `navigator`. This layer will move to a package shared with a React Native app. Values that depend on the platform arrive as parameters from `src/main.tsx`. Biome rejects violations.
4. Routes in `src/routes` are thin. A route validates search params, starts the data loading in the `loader` and renders a feature component. Business rules, forms and tables stay in the feature.
5. Code outside a feature imports that feature only through `@/features/<name>` (data) or `@/features/<name>/components` (public components). Inside the feature itself, use relative imports. Biome and the test `src/architecture.test.ts` reject violations.
6. Interface components come from `src/components/ui`. Do not build a button, input, dialog or select from scratch. If a component is missing, add it with the shadcn CLI.
7. Toasts, dialog state and navigation stay in the components. The mutation hooks in `api/mutations.ts` only call the API and invalidate the cache. The component passes `onSuccess` and `onError` in the second argument of `mutate`.

A feature has two entry files because of code splitting. The `loader` of a route is in the main bundle and imports `@/features/<name>`. The route component is in a chunk loaded on demand and imports `@/features/<name>/components`. If `index.ts` exported components, the code of every screen would go into the main bundle.

Every deploy renames the files in `/assets`. A tab opened before the deploy requests a route chunk that no longer exists. `installChunkReloadHandler`, called in `src/main.tsx`, listens to the `vite:preloadError` event and reloads the page once. If the chunk fails again within 10 seconds, the router error screen appears. Do not remove this call and do not add a second handler for the same event.

## Code standards

Names and files:

- Files in kebab-case: `item-form-dialog.tsx`, `use-mobile.ts`. Components in PascalCase, hooks with the `use` prefix, constants in `UPPER_SNAKE_CASE`.
- Named exports. Do not use `export default`, except where a library requires it (configs and `React.lazy`).
- Imports from other folders use the `@/` alias. Imports inside the same feature are relative.
- One component per file, except small helper components used only there.
- The test sits next to the tested file, with the `.test.ts` or `.test.tsx` suffix.

TypeScript:

- The API data types come from `@/api/generated`. Do not redeclare by hand a type that the client already generates.
- Form types come from the Zod schema, with `z.infer`.
- Index access returns `T | undefined` because of `noUncheckedIndexedAccess`. Handle the `undefined` with a check or with `??`.
- Declare the props of each component in an `interface` right above it.

Data:

- Reads: a `<resource>ListOptions` function in `api/queries.ts`, used by the route `loader` and by the hook. This way both share the same query key.
- Writes: one hook per operation in `api/mutations.ts`, which invalidates the cache in `onSuccess`.
- State that must survive a reload or be shared by link (page, filters, sorting) lives in the route search params, validated with Zod. The rest lives in `useState` in the component.
- There is no global store. Server data lives in the TanStack Query cache.

Interface:

- Style only with Tailwind classes. Use the theme tokens (`bg-background`, `text-muted-foreground`, `border`, `text-destructive`), which already cover the light and dark themes. Do not write fixed colors such as `#fff` or `bg-white`.
- Combine conditional classes with `cn()` from `@/lib/utils`.
- Icons only from `lucide-react`.
- The font is Geist, from the package `@fontsource-variable/geist`, set in `--font-sans` in `src/index.css`. Do not load a font from a `<link>` to another site.
- Forms use React Hook Form with `zodResolver` and the components from `@/components/ui/form`. Do not control fields with `useState`.
- Every list handles four states: loading, error with retry, empty and with data.
- Every mutation shows a success toast and an error toast with `getErrorMessage(error, t("errors.unexpected"))`, and disables the submit button while it is pending (`LoadingButton`).
- Every destructive action asks for confirmation in a dialog.
- Every icon-only button has a text in `<span className="sr-only">`. Every field has a `FormLabel`. The tests find the elements by these names.
- Every text a user can read or a screen reader can announce comes from `t()`. The section "Interface text and languages" has the rules.

Comments explain the reason for a decision that the code does not make clear. Do not describe what the next line does.

## Interface text and languages

The application has two languages, `en-US` and `pt-BR`. Each one is a JSON file in `src/locales`, named after its BCP 47 tag. The files are imported by `src/lib/i18n.ts` and go into the main bundle.

On page load, `src/main.tsx` picks the language: the choice stored in `localStorage` under `ui-language`, or else the first language of `navigator.languages` that matches, or else `en-US`. A browser in `pt-PT` gets `pt-BR`. `LanguageToggle`, in the sidebar footer, changes the language and stores the choice. `src/main.tsx` also sets the `lang` attribute of `<html>`.

Rules:

1. Do not write interface text in a component, route or schema. This covers visible text, `placeholder`, `aria-label`, `title`, `sr-only` text, toasts and the tab title. Add a key to both files in `src/locales` and read it with `t()`.
2. In a component, use `const { t } = useTranslation()` from `react-i18next`. A function that is not a component and builds interface, such as `getItemColumns`, receives `t` as a parameter, and the caller includes `t` in the dependencies of its `useMemo`.
3. Outside React, use `i18n.t()` from `@/lib/i18n`. The routes do this in `head`. When the language changes, `src/main.tsx` calls `router.invalidate()`, which runs `head` again.
4. The keys are nested by area: `common`, `errors`, `nav`, and one object per feature, such as `auth`. Reuse the keys in `common` for texts such as "Save" and "Cancel". Put the rest under the feature, even when another feature has the same text today.
5. Use `{{name}}` for a value inside a text and pass it as the second argument of `t()`. Do not join translated pieces with `+` or a template string, because the word order changes between languages. When a text has an element in the middle, use `<Trans>` with named tags, as `DataTablePagination` does.
6. For a text that depends on a number, use the i18next plural keys: `rows_one` and `rows_other` in the files, and `t("rows", { count })` in the code.
7. A Zod validation message is a translation key, not a sentence. Declare the keys in a constant with `satisfies Record<string, TranslationKey>`, as `src/features/auth/schemas.ts` does. `FormMessage` translates the key when it renders. `schemas.ts` imports only the `TranslationKey` type from `@/lib/i18n`, which keeps rule 3 of the architecture.
8. `getErrorMessage(error, fallback)` receives the fallback already translated, usually `t("errors.unexpected")`. A message that comes from the API is shown in the language the back end wrote it in. The front end does not translate it.
9. Format numbers, money and dates with `Intl.NumberFormat` and `Intl.DateTimeFormat`, passing `getLanguage()` from `@/lib/i18n` as the locale. Do not write a fixed locale such as `"en-US"` in a formatter. Create the formatter inside the function that formats, or cache one per language, because a formatter created at module load keeps the first language.
10. Language names are the only interface text outside the locale files. They are in `LANGUAGE_NAMES`, in `src/lib/i18n.ts`, each written in its own language.
11. `APP_NAME` is a product name and is not translated.

What checks these rules:

- `tsc` rejects a `t()` key that is not in `en-US.json`, through `src/i18next.d.ts`.
- `src/locales/locales.test.ts` fails when `pt-BR.json` has a missing key, an extra key, an empty text, or a text whose `{{variables}}` and `<tags>` differ from the English one.
- Nothing detects a sentence written directly in a component. Check your own diff for it before finishing.

`src/components/ui/dialog.tsx`, `sheet.tsx`, `sidebar.tsx` and `form.tsx` were changed to call `t()`. Adding one of them again with the shadcn CLI overwrites that change. A component added by the CLI may bring English text, such as a "Close" label. Replace it with `t()` in the same task.

### How to add a language

1. Create `src/locales/<tag>.json` with the same keys as `en-US.json`.
2. In `src/lib/i18n.ts`, add the tag to `LANGUAGES`, its name to `LANGUAGE_NAMES` and its file to `resources`.
3. Add the file to `LOCALES` in `src/locales/locales.test.ts`.
4. Update this section and the section "Idiomas" of the README.

## How to create a new feature

Use `src/features/account` as the model for a form with a query and a mutation. There is no list feature yet: the removed example `items` shows a paginated list with the four states, a table, dialogs and the matching tests (`git show 9d50242:src/features/items/`). The example below creates the `orders` feature.

1. Confirm that the endpoints are in `openapi.json`. If the back end changed, follow the section "How to update the client when the back end changes".
2. Add an `orders` object to both files in `src/locales`, with the texts of the screen, and `nav.orders` with the menu title. Add keys to it as you write the next steps.
3. Create `src/features/orders/schemas.ts` with the Zod schema of the form, the inferred type, the function that converts the form values into the request body and the schema of the route search params. The length limits must match the ones in `openapi.json`. The validation messages are translation keys.
4. Create `src/features/orders/api/queries.ts`. Export one query options function per read (`ordersListOptions`), built on the generated function (`ordersReadOrdersOptions`), and a hook that uses it (`useOrdersList`). The generated functions are in `@/api/generated/@tanstack/react-query.gen` and the types in `@/api/generated`.
5. Create `src/features/orders/api/mutations.ts`. Each hook spreads the generated mutation (`...ordersCreateOrderMutation()`) and, in `onSuccess`, invalidates the queries that became outdated, with the generated query key (`ordersReadOrdersQueryKey()`).
6. Create the components in `src/features/orders/components/`. The page receives the pagination by props and does not use router hooks. Handle the four states of a list: loading (`DataTableSkeleton`), error (`ErrorState` with `getErrorMessage` and a retry button), empty (`EmptyState`) and with data (`DataTable` and `DataTablePagination`).
7. Create `src/features/orders/components/index.ts` exporting only the page, and `src/features/orders/index.ts` exporting hooks, query options, schemas and types.
8. Create the route `src/routes/_app/orders.tsx` by copying `src/routes/_app/settings.tsx` (add `validateSearch` and `loaderDeps` for search params, as the removed `items.tsx` did). It uses `validateSearch`, `loaderDeps`, `loader` with `prefetchQuery` and renders the page. The tab title in `head` uses `i18n.t("nav.orders")`.
9. Add the menu item to `NAV_ITEMS`, in `src/components/layout/app-sidebar.tsx`, with `titleKey: "nav.orders"`.
10. Write the tests required for a new feature, described in the "Tests" section: `schemas.test.ts`, the component test of the page and the E2E spec with the mocked API.
11. Run `bun run lint:fix`, `bun run check`, `bun run test:e2e` and `bun run build`.
12. If this is the first real feature of the project, follow the section "How to remove the example feature".

About API errors: the generated client throws the response body already parsed from JSON, and not an `Error` instance. Always use `getErrorMessage(error, t("errors.unexpected"))` from `@/api/errors` to get the text. It understands `{ detail: "..." }` and the FastAPI 422 errors, and returns the second argument when the error has no message.

## Tests

There are three kinds of test. Each one covers what the others do not reach.

| Kind | Where it lives | Tools | What it covers |
|---|---|---|---|
| Logic unit test | `*.test.ts` next to the file | Vitest | Zod schemas, conversion functions, utilities |
| Component | `*.test.tsx` next to the component | Vitest, Testing Library, `mockApi` | The feature page in jsdom, with the real generated client and a mocked network |
| E2E | `e2e/*.spec.ts` | Playwright, Chromium | Routes, search params in the URL, navigation and the main flow in a real browser |

`src/architecture.test.ts` also runs in `bun run test` and checks rule 5.

### What each change requires

| Change | Required tests |
|---|---|
| New feature | `schemas.test.ts`, a component test of the page and an E2E spec of the main flow |
| New field in a form | Validation cases in `schemas.test.ts` and the field in the component test that submits the form |
| New endpoint used by a screen | A case in the component test that checks the method, path and body of the request |
| New screen or route | Component test and E2E spec |
| Bug fix | A test that fails without the fix and passes with it |
| New utility in `src/lib` or `src/api` | Unit test |
| New interface text | The key in both locale files. `src/locales/locales.test.ts` checks that they match |
| Refactoring with no behavior change | No new test. The existing ones must pass unchanged |

When the behavior of a screen changes, update the existing tests in the same task.

### What the component test of a page must cover

Use `src/features/account/components/settings-page.test.tsx` and `src/features/auth/components/login-page.test.tsx` as models. For a list page, the removed `items-page.test.tsx` (`git show 9d50242:src/features/items/components/items-page.test.tsx`) also covers pagination, the empty state and deletion. A page test covers:

- the loading state and the rows after the response;
- the parameters sent to the API (`offset` and `limit` calculated from the page);
- the empty state;
- the error state, with the API message and the retry;
- creation, with the request body, the toast and the updated list;
- form validation, with no request sent;
- an API error in a mutation, with the error toast and the dialog still open;
- editing, with the form filled in;
- deletion, which only happens after the confirmation;
- a change of language while the page is open, with a validation error on screen.

### How to write them

- Render with `renderWithProviders` from `@/test/render`. It creates a new `QueryClient` per test and returns `user` to simulate clicks and typing.
- Mock the network with `mockApi` from `@/test/api`, with handlers keyed by `"METHOD /path"`. Do not use `vi.mock` on the generated client or on the feature hooks. The test must exercise the URL building, the serialization and the error handling.
- Check the requests through `api.calls`.
- Mock `sonner` with `vi.mock("sonner", ...)` and check `toast.success` and `toast.error`.
- Find elements the way the user finds them: `getByRole`, `getByLabelText`, `getByText`. Use `data-testid` only when there is no role and no text.
- The tests run in `en-US`. `src/test/setup.ts` configures i18next in English and restores English after each test, so the expected texts are the ones in `en-US.json`. To test another language, call `await act(() => i18n.changeLanguage("pt-BR"))` inside the test.
- A schema test compares the validation message with the translation key, such as `"auth.validation.emailRequired"`. The component test checks the translated text on screen.
- Wait for asynchronous results with `findBy...` or `waitFor`. Do not use `setTimeout` or fixed pauses.
- Each test builds its own data and does not depend on another test.
- The test name describes the behavior: `"keeps the user on the code step after a wrong code"`.
- Do not create test files inside `src/routes`. The routes are thin and the E2E tests cover them.

### E2E

- Import `test` and `expect` from `./fixtures`, and not from `@playwright/test`. The fixture installs the mocked API on every page.
- For a new feature, add its endpoints to `MockApi` in `e2e/fixtures.ts`, stored in memory. Pages behind the login call `signIn(page)` from the fixtures; the mock accepts only the code `VALID_CODE`.
- The mocked API must answer in the same format as `openapi.json`. When the schema changes, update the mock.
- One spec per feature, with the main flow from end to end and the behaviors that depend on the URL.
- Use selectors by role and name, with `exact: true` when the text is part of another text on the screen.
- `playwright.config.ts` sets the browser locale to `en-US`, so the application starts in English. A spec that needs Portuguese uses `test.use({ locale: "pt-BR" })`, as `e2e/language.spec.ts` does.
- On the first run on a machine, install the browser with `bunx playwright install chromium`.

## How to update the client when the back end changes

1. With the back end running and `VITE_API_URL` set in `.env`, run `bun run fetch-openapi`. Without access to the back end, replace `openapi.json` by hand with the new file.
2. Run `bun run generate-client`.
3. Run `bun run typecheck`. Each error points to a usage that the back end broke: a renamed field, a new required parameter, a removed endpoint.
4. Fix the errors in the features. Also adjust the Zod schemas in `schemas.ts` and the mocked API in `e2e/fixtures.ts`.
5. Run `bun run check`.
6. Include `openapi.json` and `src/api/generated` in the same commit. The `Code quality` GitHub workflow fails when the two are out of sync.

The function names come from the OpenAPI `operationId`. The back end builds the `operationId` as `<TAG>-<function name>`, as described in the README: `ME-read_me` generates `meReadMe`. If a generated function changes its name unexpectedly, the function or the tag was renamed in the back end.

## How to add a shadcn component

```bash
bunx shadcn@latest add <name>
```

Example: `bunx shadcn@latest add textarea`. The CLI reads `components.json`, writes the file to `src/components/ui` and installs the Radix dependencies. Biome ignores this folder. You can adjust styles in these files, but do not recreate the component elsewhere. Before adding, check whether the component already exists in the folder.

## How to add an environment variable

Add the variable in three places: the schema in `src/config/env.ts`, `src/vite-env.d.ts` and `.env.example`. The name must start with `VITE_`. Read the value through `env`, from `@/config/env`, and never through `import.meta.env` outside that file.

## Authentication

Login is by a 6-digit code sent to the email; there is no password. These are the only places that know about it:

1. `src/features/auth/session.ts`: `createAuthSession` keeps the tokens behind the `SessionStorage` interface, refreshes the access token when it expires within `REFRESH_MARGIN_MS`, and shares one refresh between concurrent requests, because the back end revokes a session whose refresh token is used twice. It has no browser API (rule 3).
2. `src/main.tsx`: creates the session with `createJsonStorage(window.localStorage, ...)` and a device id from `getOrCreateId` (`src/lib/browser-storage.ts`), passes `getToken` and `onUnauthorized` to `configureApiClient`, puts the session in the router context (`auth`) and in `AuthSessionContext`.
3. `src/api/client.ts`: sends the token to operations that declare a security scheme and calls `onUnauthorized` on their 401. A 401 of a login operation (a wrong code) does not call it.
4. `src/routes/_app.tsx`: `beforeLoad` redirects to `/login?redirect=...` without a session. `src/routes/login.tsx` sends a signed-in user to the redirect, which `safeRedirect` limits to paths of this application.

Components reach the session with `useAuthSession()`. After a login or a logout the query cache is cleared, so data of one account never shows up for another. Never read the tokens in a component and never send them anywhere but through the generated client.

## Commits

Commit or push only when the user asks. Work on a branch, never on `main` or
`develop` directly: `feat/<short-topic>`, `fix/<short-topic>`, `chore/<short-topic>`.

Message format, in English:

```text
<type>: <what changed, imperative, lowercase, no period>

<optional body: why, and what a reviewer cannot see in the diff>
```

- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `build`.
- Subject at most 72 characters. Body lines at most 72 characters, only
  when the subject is not enough; at most 5 short lines or bullets. Do not
  list every file or repeat the diff.
- No trailers or attribution: no `Co-Authored-By`, `Signed-off-by` or
  "Generated with" lines, and no links to AI tools or chat sessions, in
  commits, pull requests or versioned files.
- One logical change per commit. Split unrelated changes; do not mix a
  refactor with a feature.
- Commit only after `bun run check` (and `bun run test:e2e` when a screen changed) pass.
- Never commit secrets, `.env` files, build output, caches or test reports.
- `openapi.json` and `src/api/generated` go in the same commit.
- Prefer a new commit to rewriting history. Amend or force-push only when
  the user asks, and only with `--force-with-lease` on a feature branch.

Examples:

```text
feat: add email code login
fix: keep the code step open after a wrong code
docs: describe the restricted database role
```

## Definition of done

A task is complete only when all the items below are true:

- `bun run check` finishes with no errors and no new warnings.
- `bun run test:e2e` passes, if the task touched a screen, a route, a form, navigation or the layout.
- `bun run build` passes, if the task touched dependencies, configuration or routes.
- The tests required by the table in the "Tests" section exist and pass.
- `openapi.json` and `src/api/generated` are in sync, if the task touched either of them.
- This file and the README are still correct. If the task changed a command, a folder, a rule or a pattern, update both. The README is written in Portuguese.

## What never to do

- Edit `src/api/generated/**` or `src/routeTree.gen.ts` by hand.
- Use `fetch`, `axios` or `XMLHttpRequest` outside the generated client.
- Use `any`, `as any`, `@ts-ignore`, `@ts-expect-error` or `!` (non-null assertion) to silence the compiler. Fix the type.
- Disable a Biome rule with `biome-ignore` to make the lint pass.
- Build interface components from scratch when shadcn has an equivalent.
- Import components, `sonner`, `react-dom` or browser globals in the data layer (rule 3).
- Import internal files of another feature (rule 5).
- Fetch data with `useEffect` and `useState`, or keep in `useState` a copy of data that is already in the TanStack Query cache.
- Write query keys by hand. Use the generated `*QueryKey()` and `*Options()` functions.
- Read `import.meta.env` outside `src/config/env.ts`.
- Write interface text outside `src/locales`, or add a key to only one of the locale files.
- Pass a fixed locale to an `Intl` formatter.
- Add a second library for something the stack already covers: icons, dates, global state, HTTP requests, components.
- Delete, skip (`.skip`) or loosen a test to make it pass.
- Declare the task complete without having run `bun run check`.
- Run Git commands that change the repository (commit, push, reset) without an explicit request from the user. When asked, follow the section "Commits".
