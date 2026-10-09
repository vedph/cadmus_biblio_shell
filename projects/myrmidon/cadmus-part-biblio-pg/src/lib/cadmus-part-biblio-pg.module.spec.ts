import { TestBed } from '@angular/core/testing';
import { ROUTES, Routes } from '@angular/router';

import { PendingChangesGuard } from '@myrmidon/cadmus-core';
import { EXT_BIBLIOGRAPHY_PART_TYPEID } from '@myrmidon/cadmus-part-biblio-ui';

import { CadmusPartBiblioPgModule } from './cadmus-part-biblio-pg.module';
import { ExtBibliographyPartFeatureComponent } from './ext-bibliography-part-feature/ext-bibliography-part-feature.component';

describe('CadmusPartBiblioPgModule', () => {
  it('should route the part type to its feature editor', () => {
    TestBed.configureTestingModule({ imports: [CadmusPartBiblioPgModule] });
    const routes = TestBed.inject(ROUTES).flat() as Routes;
    expect(routes).toContainEqual({
      path: `${EXT_BIBLIOGRAPHY_PART_TYPEID}/:pid`,
      pathMatch: 'full',
      component: ExtBibliographyPartFeatureComponent,
      canDeactivate: [PendingChangesGuard],
    });
  });
});
