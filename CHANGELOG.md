# History

- 2026-10-09:
  - replaced the library build scripts with `scripts/build-libs.mjs` (`pnpm run build:libs`), which builds the libraries in dependency order computed from their manifests and actual imports, guarded by `scripts/check-local-libs.js`. Added `scripts/test-libs.mjs` (`pnpm run test:libs`).
  - completed the migration to Vitest: all the projects use the `@angular/build:unit-test` builder with `jsdom`; added Angular Testing Library, `jest-dom` matchers and `@vitest/coverage-v8` (`ng test <project> --coverage`); removed Karma, Jasmine and their stale entry points (`karma.conf.js`, `test.ts`, unused `polyfills.ts`).
  - fixed library peer dependencies: added missing local imports (`cadmus-biblio-api` → `cadmus-biblio-core`; `cadmus-part-biblio-ui` → `cadmus-core`, `ngx-tools`; `cadmus-part-biblio-pg` → `cadmus-api`), aligned stale ranges (`ngx-mat-tools` 3, `cadmus-ui` 18, `auth-jwt-login` 10) and removed the unused `cadmus-ui` peer from `cadmus-biblio-ui`.
  - `@myrmidon/cadmus-biblio-core`: added full unit tests. Fixed `WorkKeyService.buildKey` author sorting: a missing ordinal vs. an ordinal of 0 was considered different but compared as equal, so the last name/suffix tie-break was skipped and the key could differ from the one built by the backend.
  - `@myrmidon/cadmus-biblio-api`: added full unit tests. Fixed in the backend (`CadmusBiblioApi`): filtering works/containers by type never matched (the type name was compared instead of its ID), and the datation range filters sent by this service were ignored (missing from the API binding model).
  - tests now run zoneless like the app: each project has a `test-providers.ts` (unit-test builder `providersFile`) providing `provideZonelessChangeDetection()`, because the builder initializes TestBed with zone-based change detection whenever `zone.js` is resolvable (as with pnpm's `ng` shim). `zone.js` (unused by the app) moved to `devDependencies`. Component tests use `@testing-library/angular/zoneless`, which unlike the classic `render` does not run change detection after each event, so missing change detection notifications are not masked.
  - `@myrmidon/cadmus-biblio-ui`: added full unit tests and fixed these bugs:
    - all the editors: validation error messages for too long values never appeared (`maxLength` instead of `maxlength` error key).
    - all the editors: forms are nested (authors, keywords and external ID editors in the work editor; work editor and filter in the works list, in turn inside the bibliography part editor), and submit events bubble: e.g. accepting the authors also saved the whole work, and in the part editor even the part. Each embeddable form now stops the propagation of its submit event; Enter in a lookup no longer submits its form.
    - `ExternalIdComponent`: the default scope (first scope entry) was immediately cleared, and never applied to new IDs added from `ExternalIdsComponent`.
    - `ExternalIdsComponent`: deleting an ID always deleted the last one (or the edited one) rather than the clicked one; the next input change after the first one was ignored. Added tooltips to icon buttons.
    - `KeywordPickerComponent`, `WorkKeywordsComponent`: a picked keyword could be added again when another option was picked (`onSelectionChange` fires also for deselection: replaced with `optionSelected`); clearing the lookup rendered an empty option; the clear button of the picker was always disabled. `WorkKeywordsComponent` also ignores already present keywords, and its search box no longer is a form nested in the keywords form.
    - `WorkAuthorsComponent`, `WorkKeywordsComponent`, `WorkListComponent`: loaded items were added to the form array bypassing its API, so their changes did not update the form validity (e.g. a loaded author whose last name was cleared could be saved), nor the summary; an empty input did not clear the previous items. The authors summary was not refreshed in zoneless mode (now a signal).
    - `WorkDetailsComponent`: the datation was never shown (passed to the historical date pipe, which expects a model rather than its text); a missing year was rendered as `undefined`.
    - `WorkFilterComponent`: resetting the filters did not reset the author; a persisted filter was shown but not applied; the lookups now reflect the author and container in the filter.
    - `WorkBrowserComponent`: applying a filter kept the current page number (yielding an empty page); late responses could replace the page requested last; loading flags and work details were not refreshed in zoneless mode (now signals); the selected row was never highlighted.
    - `WorkComponent`: in zoneless mode the loaded work's authors, keywords and links could fail to reach their editors (values were set in a `setTimeout`); removing the container could not be saved (the control was reset to pristine); a container was saved with the hidden container and pages values. Added a tooltip to the build key button.
    - `WorkListComponent`: tag/note validation errors never appeared; editing a work dropped the tag and note of its entry; tag/note text typed just before another list operation was lost; the details and editor panels were not refreshed in zoneless mode (now signals); the editor of a new work had an empty header.
    - `WorkRefLookupService`: removed debug log.
  - `@myrmidon/cadmus-part-biblio-ui`: added full unit tests. Fixed `ExtBibliographyPartComponent`: the link scopes thesaurus (`ext-biblio-link-scopes`) was loaded but never passed to the works list; a part without value did not clear the previous entries.

- 2026-09-05: updated packages.

## 13.0.0

- 2026-06-20:
  - ⚠️ migrated demo app to zoneless.
  - ⚠️ migrated to new Monaco wrapper.
  - ⚠️ upgraded to Angular 22.
  - ⚠️ replaced styles with Angular Material M3.
  - added `id` and `getById` to lookup services.

## 12.0.1

- 2025-11-23:
  - ⚠️ upgraded to Angular 21.
  - migrated to `pnpm`.

## 12.0.0

- 2025-08-06: ⚠️ untied language from ISO639-3 (`@myrmidon/cadmus-biblio-ui`, `@myrmidon/cadmus-part-biblio-ui`, `@myrmidon/cadmus-part-biblio-pg`).
- 2025-08-02: updated Angular and packages.
- 2025-07-16: ⚠️ updated packages and bumped all major versions.

## 11.0.0

- 2025-06-03:
  - ⚠️ upgraded to Angular 20.
  - better loading message.
- 2025-05-06: updated Angular and packages.

## 10.0.0

- 2025-03-18: updated Angular and packages (major versions of Cadmus packages).

## 9.0.0

- 2025-01-27:
  - ⚠️ migrated to signals. Note that this did not affect `cadmus-biblio-core` and `cadmus-biblio-api`.
  - updated Angular and packages.

## 8.0.0

- 2025-01-04:
  - ⚠️ converted to standalone.
  - ⚠️ updated [Cadmus dependencies](https://github.com/vedph/cadmus-shell-v3) to version 11 (standalone components).

## 7.0.0

- 2024-12-06:
  - ⚠️ upgraded to new core dependencies.
  - M3 theme.

## 6.0.0

- 2024-11-19: ⚠️ upgraded to .NET 9.
- 2024-11-18: updated Angular and packages.

## 5.1.1

- 2024-06-08:
  - updated Angular and packages.
  - added `class="mat-X"` for each `color="X"` (e.g. `class="mat-primary"` wherever there is a `color="primary"`) to allow transitioning to Angular Material M3 from M2. This also implies adding it directly to the target element, so in the case of `mat-icon` inside a button with color the class is added to `mat-icon` directly (unless the button too has the same color). This allows to keep the old M2 clients while using the new M3, because it seems that the compatibility mixin is not effective in some cases like inheritance of color, and in the future `color` will be replaced by `class` altogether.
  - migrated to new control flow syntax (`@myrmidon/cadmus-biblio-ui`).
  - fixes to Docker image scripts.

## 5.1.0

- 2024-05-24:
  - ⚠️ upgraded to Angular 18 and updated packages, bumping all libraries version numbers to 5.1.0.
  - replaced HTTP providers using functional providers and removing deprecated Angular HTTP module, e.g.:

    ```ts
    provideHttpClient(withInterceptors([authJwtInterceptor]))
    ```

- 2024-04-13: ⚠️ upgraded to [bricks V2](https://github.com/vedph/cadmus-bricks-shell-v2). Library major **version** bumped to 5.
- 2023-11-18: updated Angular.

## 4.0.0

- 2023-11-09: ⚠️ upgraded to Angular 17.
- 2023-08-29: updated Angular.

## 3.1.0

- 2023-07-29: added work and container links.
- 2023-07-28: added `datation` and `datationValue` to works and containers.

## 3.0.0

- 2023-06-16:
  - updated Angular and packages.
  - refactored Docker compose script for PostgreSQL.

## 2.0.0

- 2023-05-11: updated to Angular 16.

## 1.4.3

- 2023-02-20:
  - updated key generation algorithm to reflect API counterpart.
  - use lookup to display selected item (for container) or reset it when just picking an item (for authors).

## 1.4.2

- 2023-02-20: validation in work authors.

## 1.4.1

- 2023-02-20: fixed number field not displayed in work editor for containers.

## 1.4.0

- 2023-02-18:
  - added optional `yearPub2` to work/container.
  - added bibliography page.

## 1.3.0

- 2023-02-17:
  - updated Angular.
  - added enabled properties to work list.
  - replaced author picker and work picker with brick lookup.
  - added pipes to display work/author.
- 2023-01-24:
  - minor refactorings in work entries list and part editor.
  - fix to work list subscriptions.
  - added Cadmus components to demo frontend.
- 2023-01-10: close work editor when saved in biblio UI.

## 1.2.1

- 2023-01-09: updated Angular and packages.
- 2022-12-22: updated Monaco editor (changing glob as specified [here](https://github.com/atularen/ngx-monaco-editor)).
- 2022-12-21: updated Angular and packages.
- 2022-11-30: updated packages.
- 2022-11-22:
  - upgraded to Angular 15 adjusting UI.
  - removed `@angular/flex-layout`.
  - library versions bumped to 2.0.0.
- 2022-09-24:
  - scroll to work info/editor.
  - added container deletion capability to work list.
  - scroll work editor into view.
- 2022-09-15: updated Angular and Cadmus packages.
- 2022-07-14: upgraded Angular.

## 1.2.0

- 2022-06-11: upgraded to Angular 14 and dropped legacy dependency from CadmusMaterial.

## 1.1.3

- 2022-05-18: upgraded Angular.

## 1.1.2

- 2022-04-29: upgraded Angular and removed moment.

## 1.1.1

- updated Angular and Cadmus related packages.
