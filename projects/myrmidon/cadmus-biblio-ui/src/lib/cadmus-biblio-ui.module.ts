import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClipboardModule } from '@angular/cdk/clipboard'

// material
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CadmusCoreModule } from '@myrmidon/cadmus-core';
import { CadmusBiblioApiModule } from '@myrmidon/cadmus-biblio-api';
import { CadmusBiblioCoreModule } from '@myrmidon/cadmus-biblio-core';
import { CadmusRefsLookupModule } from '@myrmidon/cadmus-refs-lookup';
import { CadmusUiModule } from '@myrmidon/cadmus-ui';
import { NgToolsModule } from '@myrmidon/ng-tools';
import { NgMatToolsModule } from '@myrmidon/ng-mat-tools';

import { WorkComponent } from './components/work/work.component';
import { WorkDetailsComponent } from './components/work-details/work-details.component';
import { KeywordPickerComponent } from './components/keyword-picker/keyword-picker.component';
import { WorkFilterComponent } from './components/work-filter/work-filter.component';
import { WorkBrowserComponent } from './components/work-browser/work-browser.component';
import { WorkPickerComponent } from './components/work-picker/work-picker.component';
import { WorkAuthorsComponent } from './components/work-authors/work-authors.component';
import { WorkKeywordsComponent } from './components/work-keywords/work-keywords.component';
import { WorkListComponent } from './components/work-list/work-list.component';

@NgModule({
  declarations: [
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
    ClipboardModule,
    // material
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    MatToolbarModule,
    // cadmus
    NgToolsModule,
    NgMatToolsModule,
    CadmusCoreModule,
    CadmusRefsLookupModule,
    CadmusUiModule,
    CadmusBiblioCoreModule,
    CadmusBiblioApiModule,
  ],
  exports: [
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
