# Signal Forms Migration Log

Migration of this workspace from reactive forms to Angular signal forms, after updating the Cadmus packages to version 20 (2026-10-09).

Only verified facts are recorded here. Anything not measured is marked **believed**, together with how to check it.

## Starting point

- The v20 package update (`package.json`, `pnpm-lock.yaml`) was uncommitted. With it, `cadmus-biblio-core` (28 tests), `cadmus-biblio-api` (27) and `cadmus-biblio-ui` (126) built and passed unchanged. `cadmus-biblio-ui` still used reactive forms, which v20 does not remove; `cadmus-part-biblio-ui` used the removed reactive contract of `ModelEditorComponentBase` (`buildForm`, constructor parameters).
- Library resolution: `node_modules/@myrmidon` has no copy of the local libraries; they resolve only through `tsconfig.json` paths to `dist/myrmidon/*`. `scripts/check-local-libs.js` (run by `pnpm build:libs`) passed before every full rebuild.

## Order and results

| library                 | forms code                                     | tests after   | build |
| ----------------------- | ---------------------------------------------- | ------------- | ----- |
| `cadmus-biblio-core`    | none                                           | 28 ✔          | ✔     |
| `cadmus-biblio-api`     | none                                           | 27 ✔          | ✔     |
| `cadmus-biblio-ui`      | 9 components                                   | 149 ✔         | ✔     |
| `cadmus-part-biblio-ui` | part editor                                    | 12 ✔          | ✔     |
| `cadmus-part-biblio-pg` | unused `FormsModule`/`ReactiveFormsModule`     | 5 ✔           | ✔     |
| app (`src/`)            | reset password page; 3 unused module imports   | see below     | ✔     |

After the last change all the libraries were rebuilt in dependency order with `node scripts/build-libs.mjs` (guard OK, 5/5 built), then the app with `ng build`.

## Design decisions

- **Draft from model**: every editor derives its draft with `linkedSignal`. Manual-save editors (external ID, authors, keywords, work) rebuild the draft from each new model. The autosaving works list uses `linkedSignal({ source, computation: (entries, previous) => ... })`, keeping `previous.value` when the incoming entries equal `toEntries(previous.value)`, i.e. the echo of its own save. The interaction state is reset by an effect keyed on the draft, only when the draft is in sync with the model.
- **No `<form>`** in any library component. Enter-to-save is kept with `(keydown.enter)` on the component root and `isImplicitSubmission` from `@myrmidon/cadmus-ui`. The inner editor calls `preventDefault()`, so outer editors ignore the same keystroke. The reset password page is the only `<form [formRoot]>`, with a `submission.action`.
- **`ExternalIdsComponent`** has no form: its former `FormControl` only held the list and an echo flag, and the `ids` model itself is the state.
- **`WorkFilterComponent`**: the applied filter is a signal, and the draft a `linkedSignal` over it, whose `previous` keeps the loaded author/container objects when their IDs did not change.
- **Child editor outputs** in `WorkComponent` and in the part editor go through `setFieldFromChild` (equal values are not changes).

## Verified facts

- **`maxLength` becomes a native attribute.** `FormField` sets `maxlength` on native text inputs (`@angular/forms` source, `forms.mjs`: `case 'maxLength': renderer.setAttribute(...)`), so typing/pasting beyond the limit is truncated. Two specs relying on pasting 51 characters failed for this reason, and were replaced by specs pinning the attribute and the error for a too long bound value.
- **Error kinds**: `maxLength`, `minLength`, `required`, `min`, `max`, `pattern` (`signals.mjs`, `kind = '...'`).
- **Echo guard works, and its tests bite.** Removing the `previous` check from `WorkListComponent._draft` makes 3 specs fail (trailing space "abc " → "abcd", lost focus, validation error cleared by autosave). Removing the in-sync guard from its autosave makes "should not save a normalized copy" fail. Both mutations were reverted and `dist/` rebuilt.
- **Nested Enter**: removing `preventDefault()` from `WorkAuthorsComponent.onEnterKey` makes "should only accept the authors on Enter in an author input" fail (the work gets saved too). Reverted and rebuilt.
- **Submit events and nested forms** (Chrome 155.0.8059.40, headless, forms nested via DOM APIs): the inner form is really nested (`inner.parentElement === outer`), and its button belongs to it. A click on the inner submit button, or `inner.requestSubmit()`, fires `submit` on the inner form only. Bubble-phase listeners on the outer form, `body` and `window` never see it, but a capture-phase listener on the outer form does. So the earlier CHANGELOG statement that submit events bubble to the parent form is wrong.
- **`MatSelect` and `''` vs `null`**: with the filter's language "(any)" option set to `''`, an empty language select shows "(any)". The type select, whose "(any)" option is still `null`, shows nothing. Pinned in the work filter spec.

## What the browser runs

Before testing in the browser, `.angular/cache` was deleted and `ng serve` restarted. After loading the part editor, every loaded script was fetched and searched. The chunk with the biblio components had 113 `formField` bindings, 0 `formControlName`/`formGroupName`/`formArrayName`, and contained `onEnterKey` and the `previous.value` echo guard.

## Browser checks (headless Chrome over CDP, real backends)

Part editor > works list > work editor > authors editor, new part on item `b830b833…`:

- no `<form>` in the DOM; new part pristine; picking a work makes it dirty;
- typing "abc " in an entry note, waiting past the 300ms autosave: the part has "abc", the input keeps "abc " and focus; typing "d" gives "abc d" in both;
- Enter in an author's input closed the authors panel, made the work dirty, and sent no request;
- Enter in the container lookup sent no request;
- Enter in the work's number input sent `POST :5000/api/works` and no request to the Cadmus API; the part stayed dirty with its note;
- saving the part sent `POST :5034/api/parts` with note "abc d"; the part was pristine after saving;
- an existing part stored with `tag: null`, `payload: null` and note "  spaced  " opened pristine, sent no request, and closed with no pending changes prompt.

Works page and reset password page:

- Enter in the filter's title input requested `works?…&title=Steel`, and the browser showed matching works; no `<form>` on the page;
- the reset password form has `novalidate` (formRoot); Enter with an invalid email sent no request and showed the error; Enter with a valid email sent `POST …/accounts/resetpassword/request` (intercepted and failed by the test, so no mail was sent), with no page reload.

Test data: two ext-bibliography parts were created on item `b830b833…` (one per run); the duplicate `bdb43d7a…` was deleted. Work `25cdcf86…` got "Z" appended to its number and "x" to its first author's first name.

## Believed, not measured

- **`NG0956` warnings** ("track by identity caused re-creation of the entire collection of size 1") appear after accepting authors and after saving a work from the list, i.e. when a saved value rebuilds a draft. They come from the `@for ... track item` loops over field trees. The old code rebuilt its `FormArray` with new `FormGroup`s on the same events, under the same `track item`, so the old build is **believed** to have warned the same way. To check: run the previous commit's `cadmus-biblio-ui` in a spec in dev mode with a `console.warn` spy, and accept authors in `WorkAuthorsComponent`.
- The `HistoricalDateComponent` (`cadmus-refs-historical-date` 10.0.3) autosaves after a debounce. A work opened with a datation is pristine after 600ms (spec), so it is **believed** not to emit on load. With `setFieldFromChild`, an echo would not make the work dirty anyway.

## Found, not fixed (outside the migration)

- `AppComponent` always navigates to `/home` at startup (`app.component.ts:54`), so deep links are lost on reload.
- Reset password page: its `type="submit"` button is outside the `<form>` (in `mat-card-actions`), so clicking it does nothing; only Enter in the email input submits. Kept as is.
- App specs (`ng test cadmus-biblio-shell`) do not compile: `app.component.spec.ts` checks a missing `title`, and the page specs are stale CLI scaffolds declaring standalone components. Untouched by this migration.
- `WorkFilterComponent.types` is a plain array assigned in an HTTP callback. In a zoneless app this does not schedule change detection by itself (**believed** harmless in practice, as other events refresh the view; check by loading the filter with no other activity).
- `cadmus-refs-historical-date` 10.0.3 checks `getError("max-length")`, which signal forms never produce (`maxLength`), so its "tag too long" message cannot appear.
- Dead validation messages kept as they were: "tag required" in the works list (no `required` rule on tags), "too long" for the keyword language (no `maxLength` rule), "invalid language" in the work editor (no `pattern` rule).
- `LoginPageComponent` logs the logged-in user to the console (`console.log('User logged in', user)`).
