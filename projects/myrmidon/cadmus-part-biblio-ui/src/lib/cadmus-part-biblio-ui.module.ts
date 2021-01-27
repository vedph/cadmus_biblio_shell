import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CadmusBiblioApiModule } from '@myrmidon/cadmus-biblio-api';
import { CadmusBiblioCoreModule } from '@myrmidon/cadmus-biblio-core';
import { CadmusBiblioUiModule } from '@myrmidon/cadmus-biblio-ui';

// general Cadmus modules
import { CadmusMaterialModule } from '@myrmidon/cadmus-material';
import { CadmusUiModule } from '@myrmidon/cadmus-ui';
import { ExtBibliographyPartComponent } from './ext-bibliography-part/ext-bibliography-part.component';

@NgModule({
  declarations: [ExtBibliographyPartComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Cadmus
    CadmusMaterialModule,
    CadmusUiModule,
    CadmusBiblioCoreModule,
    CadmusBiblioApiModule,
    CadmusBiblioUiModule,
  ],
  exports: [ExtBibliographyPartComponent],
})
export class CadmusPartBiblioUiModule {}
