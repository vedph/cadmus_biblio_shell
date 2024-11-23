import { Pipe, PipeTransform } from '@angular/core';

import { Author, WorkAuthor } from '../models';
import { BiblioUtilService } from '../services/biblio-util.service';

@Pipe({
  name: 'biblioAuthor',
  standalone: false,
})
export class BiblioAuthorPipe implements PipeTransform {
  constructor(private _utilService: BiblioUtilService) {}

  transform(value: Author | WorkAuthor | undefined | null): unknown {
    return this._utilService.authorToString(value || null);
  }
}
