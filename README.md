# Cadmus Biblio Shell

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.6.

Cadmus frontend components for [external bibliography](https://github.com/vedph/cadmus_biblioapi).

🐋 Quick Docker image build:

1. update [env.js](src/env.js) version number and `pnpm run build:libs` (run [publish.bat](publish.bat) if required);
2. `ng build --configuration=production`;
3. `docker build . -t vedph2020/cadmus-biblio-shell:5.1.1 -t vedph2020/cadmus-biblio-shell:latest` (replace with the current version).

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.5.

## Libraries

```mermaid
graph LR;
  cadmus-biblio-api --> ngx-tools
  cadmus-biblio-api --> cadmus-biblio-core
  cadmus-biblio-ui --> ngx-tools
  cadmus-biblio-ui --> ngx-mat-tools
  cadmus-biblio-ui --> cadmus-refs-historical-date
  cadmus-biblio-ui --> cadmus-refs-lookup
  cadmus-biblio-ui --> cadmus-core
  cadmus-biblio-ui --> cadmus-biblio-api
  cadmus-biblio-ui --> cadmus-biblio-core
  cadmus-part-biblio-ui --> auth-jwt-login
  cadmus-part-biblio-ui --> cadmus-ui
  cadmus-part-biblio-ui --> cadmus-core
  cadmus-part-biblio-ui --> ngx-tools
  cadmus-part-biblio-ui --> cadmus-biblio-ui
  cadmus-part-biblio-ui --> cadmus-biblio-api
  cadmus-part-biblio-ui --> cadmus-biblio-core
  cadmus-part-biblio-pg --> cadmus-core
  cadmus-part-biblio-pg --> cadmus-api
  cadmus-part-biblio-pg --> cadmus-state
  cadmus-part-biblio-pg --> cadmus-ui-pg
  cadmus-part-biblio-pg --> cadmus-part-biblio-ui
```

## Development

- `pnpm run build:libs`: build all the libraries under `projects/myrmidon` in dependency order ([scripts/build-libs.mjs](scripts/build-libs.mjs)). Pass one or more library names to build only them and everything downstream (e.g. `pnpm run build:libs cadmus-biblio-ui`), or `--dry` to just print the order.
- `pnpm run test:libs`: run the Vitest unit tests of all the libraries, one at a time ([scripts/test-libs.mjs](scripts/test-libs.mjs)); pass library names to test only them. Libraries import their siblings from `dist`, so build them first. Single library: `ng test @myrmidon/cadmus-biblio-ui --watch=false`.
- `pnpm run check-libs`: ensure that no local library is shadowed by a copy under `node_modules`.

Tests use [Vitest](https://vitest.dev) (via the Angular `unit-test` builder, with `jsdom`); component tests use [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro).
