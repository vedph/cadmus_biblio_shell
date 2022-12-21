# Cadmus Biblio Shell

Quick Docker image build:

1. `npm run build-lib`
2. `ng build --configuration=production`
3. `docker build . -t vedph2020/cadmus-biblio-shell:1.2.0 -t vedph2020/cadmus-biblio-shell:latest` (replace with the current version).

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.5.

## History

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

### 1.2.0

- 2022-06-11: upgraded to Angular 14 and dropped legacy dependency from CadmusMaterial.

### 1.1.3

- 2022-05-18: upgraded Angular.

### 1.1.2

- 2022-04-29: upgraded Angular and removed moment.

### 1.1.1

- updated Angular and Cadmus related packages.
