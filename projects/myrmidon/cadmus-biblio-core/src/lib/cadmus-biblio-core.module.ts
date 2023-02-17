import { NgModule } from '@angular/core';

import { BiblioWorkPipe } from './pipes/biblio-work.pipe';
import { BiblioAuthorPipe } from './pipes/biblio-author.pipe';

@NgModule({
  declarations: [BiblioAuthorPipe, BiblioWorkPipe],
  imports: [],
  exports: [BiblioAuthorPipe, BiblioWorkPipe],
})
export class CadmusBiblioCoreModule {}
