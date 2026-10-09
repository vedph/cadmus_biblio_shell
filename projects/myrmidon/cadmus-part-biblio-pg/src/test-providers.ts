import { provideZonelessChangeDetection } from '@angular/core';

// Providers for the test environment (wired through the unit-test builder's
// providersFile option in angular.json). The app is zoneless, so tests must
// be too: this also applies when zone.js happens to be resolvable (e.g. as
// an optional peer in pnpm's virtual store), in which case the builder would
// otherwise initialize TestBed with zone-based change detection.
export default [provideZonelessChangeDetection()];
