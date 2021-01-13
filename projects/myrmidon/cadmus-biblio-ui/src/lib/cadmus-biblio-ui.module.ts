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
import { WorkFilterComponent } from './components/work-filter/work-filter.component';
import { WorkBrowserComponent } from './components/work-browser/work-browser.component';
import { CadmusUiModule } from '@myrmidon/cadmus-ui';
import { WorkDetailsComponent } from './components/work-details/work-details.component';
import { AuthorPickerComponent } from './components/author-picker/author-picker.component';
import { WorkListComponent } from './components/work-list/work-list.component';

@NgModule({
  declarations: [
    AuthorPickerComponent,
    KeywordPickerComponent,
    WorkAuthorsComponent,
    WorkBrowserComponent,
    WorkComponent,
    WorkDetailsComponent,
    WorkFilterComponent,
    WorkKeywordsComponent,
    WorkListComponent,
    WorkPickerComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    // cadmus
    CadmusCoreModule,
    CadmusMaterialModule,
    CadmusUiModule,
    CadmusBiblioCoreModule,
    CadmusBiblioApiModule,
  ],
  exports: [
    AuthorPickerComponent,
    KeywordPickerComponent,
    WorkAuthorsComponent,
    WorkBrowserComponent,
    WorkComponent,
    WorkDetailsComponent,
    WorkFilterComponent,
    WorkKeywordsComponent,
    WorkListComponent,
    WorkPickerComponent,
  ],
})
export class CadmusBiblioUiModule {}
