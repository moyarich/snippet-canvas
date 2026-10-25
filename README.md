# Reusable Workflows Callers — Monorepo Template

Starter template for npm-workspaces projects modeled on recent `moyarich` repositories.

## Structure

| Path                 | Purpose                                                             |
| -------------------- | ------------------------------------------------------------------- |
| `packages/snippet-canvas/` | SnippetCanvas VS Code extension with a React webview |
| `packages/example/`  | Buildable TypeScript library with Vitest tests                      |
| `apps/playground/`   | Vite + React playground consuming example library                   |
| `.github/workflows/` | CI, release, publishing, maintenance, and reusable workflow callers |
| `eslint.config.mjs`  | Shared ESLint flat config and Prettier compatibility                |
| `tsconfig.json`      | Shared TypeScript defaults                                          |

## Getting started

```sh
npm install
npm run dev
npm run checks
npm run pack:check
```

Root build and test scripts delegate to npm workspaces using `--workspaces --if-present`. Development targets the conventional `apps/playground` path, without hardcoding a package name. Vite handles individual workspace builds and the playground development server; no custom workspace runner is needed. Rename the `@template/*` workspaces and replace the example package with your own code.

## Workflows and release safety

The GitHub Actions callers were copied from `moyarich/workspace-tools`. Review all hardcoded package selectors, release triggers, publishing secrets, branch names, and build paths before enabling them in a new repository. In particular, automatic release/publish workflows should remain dry-run or disabled until intentionally configured.

The Workspace Tools CLI source in migrated callers is `checkout:upstream;branch:main`, not `checkout:current`, because this repository does not contain the Workspace Tools package. For reproducible releases, pin a published CLI version or immutable commit.

`check-dist.yml` is an opt-in example for projects that commit build outputs. If package `dist/` is gitignored, this check will fail until you explicitly choose to track distributions or replace it with an artifact-only check.

`npm run pack:check` uses npm's built-in `--workspaces` flag and includes all configured workspaces, so adjust the workspace selection if you only want to pack publishable packages.

## Typical scripts

`npm run dev`, `npm run build`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run checks`.

## Adapting this template

Add packages under `packages/*`, applications under `apps/*`, and their own `build`, `typecheck`, and `test` scripts. Keep reusable logic in packages and application-specific examples in playgrounds. Configure registry publishing only for real release packages.

## Tests and component stories

The template includes a root `vitest.config.ts`, `playwright.config.ts`, and `.storybook/` configuration. Vitest discovers `*.test.*` files in root, package and application test folders; Playwright discovers `*.spec.*` files and starts the Vite playground on port 4173. Storybook scans stories in application, package and source directories.

```sh
npm run test:unit
npx playwright install chromium
npx playwright test
npm run storybook
npm run build:storybook
```

The CI caller runs Playwright directly on `main`, manual dispatch and PRs changing spec/config files. Projects can change their Playwright fixtures and `webServer` settings in `playwright.config.ts`; no CI-specific package script is required. Storybook is a development-only workspace tool and is not included in the published example package.

## Workflow consumer inventory

Run the private/manual **Inventory reusable workflow consumers** GitHub Actions workflow (`workflow_dispatch`) to scan the default-branch workflow files of repositories accessible to `_WORKFLOW_TOKEN`. The workflow commits [the generated Markdown table](docs/workflow-consumers.md) and prints it in the Actions job summary. The token must have read access to all target repositories and write access to this repository. Private repositories are excluded by default. The manual `include-private` input opts in to publishing their names in this repository's committed inventory, which may be publicly readable.

## Release version selection

The `prepare-release-pr.yml` dispatch supports `package-json` (the default) to use each selected package's current declared `package.json` version without incrementing it, alongside `patch`, `minor`, and `major`.

## Copy shared CI callers to other repositories

[`.github/copy.yml`](.github/copy.yml) explicitly lists canonical workflow files and destination repositories. Each destination can specify `include`, `exclude`, and `overrides` keyed by source file path. The generator always reads the **source** workflow, applies destination overrides using `ruamel.yaml`, and copies the generated workflow into the target repository; it does not merge with the target's existing YAML.

The [copy workflow](.github/workflows/copy.yml) generates destination-specific YAML and uses the first-party `reusable-workflows/actions/copy-files-to-another-repository` composite action to transfer it. It runs automatically when canonical files or synchronization logic change on `main`. Manual dispatch defaults to a dry run that clones the destination and prints the diff summary without pushing. The existing `_WORKFLOW_TOKEN` secret must be able to read and write destination repositories and modify workflow files.

Currently, synchronization pushes directly to the destination branch, not a PR. An unchanged generated file results in no new commit. Files removed from the source selection are **not** deleted at the destination. Override keys must already exist in the source workflow; only `jobs`, `env`, `defaults`, `name`, and `run-name` may be overridden. This synchronization does not dynamically dispatch GitHub Actions workflows.

## SnippetCanvas

The VS Code extension lives in `packages/snippet-canvas`. See its [README](packages/snippet-canvas/README.md) and [development guide](packages/snippet-canvas/README.dev.md).

```sh
npm run build --workspace snippetcanvas
npm run typecheck --workspace snippetcanvas
npm run dev:preview --workspace snippetcanvas
npm run demo:e2e --workspace snippetcanvas
npm run package --workspace snippetcanvas
```
