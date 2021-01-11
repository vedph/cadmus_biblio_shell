import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CadmusCoreModule } from '@myrmidon/cadmus-core';
import { CadmusMaterialModule } from '@myrmidon/cadmus-material';
import { WorkPickerComponent } from './components/work-picker/work-picker.component';
import { WorkAuthorsComponent } from './components/work-authors/work-authors.component';
import { WorkKeywordsComponent } from './components/work-keywords/work-keywords.component';
import { WorkComponent } from './components/work/work.component';
import { CadmusBiblioApiModule } from '@myrmidon/cadmus-biblio-api';
import { CadmusBiblioCoreModule } from '@myrmidon/cadmus-biblio-core';
import { KeywordPickerComponent } from './components/keyword-picker/keyword-picker.component';

@NgModule({
  declarations: [
    KeywordPickerComponent,
    WorkPickerComponent,
    WorkAuthorsComponent,
    WorkKeywordsComponent,
    WorkComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    // cadmus
    CadmusCoreModule,
    CadmusMaterialModule,
    CadmusBiblioCoreModule,
    CadmusBiblioApiModule,
  ],
  exports: [
    KeywordPickerComponent,
    WorkPickerComponent,
    WorkAuthorsComponent,
    WorkKeywordsComponent,
    WorkComponent,
  ],
})
export class CadmusBiblioUiModule {}
