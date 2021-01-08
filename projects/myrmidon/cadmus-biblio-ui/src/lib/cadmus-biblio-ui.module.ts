import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CadmusCoreModule } from '@myrmidon/cadmus-core';
import { CadmusMaterialModule } from '@myrmidon/cadmus-material';
import { WorkPickerComponent } from './components/work-picker/work-picker.component';
import { WorkAuthorsComponent } from './components/work-authors/work-authors.component';

@NgModule({
  declarations: [WorkPickerComponent, WorkAuthorsComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    // cadmus
    CadmusCoreModule,
    CadmusMaterialModule,
  ],
  exports: [WorkPickerComponent, WorkAuthorsComponent],
})
export class CadmusBiblioUiModule {}
