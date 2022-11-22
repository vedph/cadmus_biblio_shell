import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PendingChangesGuard } from '@myrmidon/cadmus-core';
import { CadmusPartBiblioUiModule, EXT_BIBLIOGRAPHY_PART_TYPEID } from '@myrmidon/cadmus-part-biblio-ui';
import { CadmusStateModule } from '@myrmidon/cadmus-state';
import { CadmusUiPgModule } from '@myrmidon/cadmus-ui-pg';

import { ExtBibliographyPartFeatureComponent } from './ext-bibliography-part-feature/ext-bibliography-part-feature.component';

// https://github.com/ng-packagr/ng-packagr/issues/778
export const RouterModuleForChild = RouterModule.forChild([
  {
    path: `${EXT_BIBLIOGRAPHY_PART_TYPEID}/:pid`,
    pathMatch: 'full',
    component: ExtBibliographyPartFeatureComponent,
    canDeactivate: [PendingChangesGuard],
  },
]);

@NgModule({
  declarations: [ExtBibliographyPartFeatureComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModuleForChild,
    // Cadmus
    CadmusUiPgModule,
    CadmusStateModule,
    CadmusPartBiblioUiModule
  ],
  exports: [ExtBibliographyPartFeatureComponent],
})
export class CadmusPartBiblioPgModule {}
