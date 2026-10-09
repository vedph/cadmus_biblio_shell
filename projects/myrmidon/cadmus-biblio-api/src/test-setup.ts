// Vitest setup file (wired through the unit-test builder's setupFiles option
// in angular.json).
// Some rendered components (from this workspace or from @myrmidon packages)
// use $localize; library test builds do not include the @angular/localize
// polyfill by default, so it is initialized here.
import '@angular/localize/init';
// DOM matchers (toBeInTheDocument, toHaveValue, ...) for Testing Library.
import '@testing-library/jest-dom/vitest';
