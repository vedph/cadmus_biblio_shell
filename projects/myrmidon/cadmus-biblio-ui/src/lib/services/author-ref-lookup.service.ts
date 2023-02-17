import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { Author, BiblioUtilService } from '@myrmidon/cadmus-biblio-core';
import {
  RefLookupFilter,
  RefLookupService,
} from '@myrmidon/cadmus-refs-lookup';

@Injectable({
  providedIn: 'root',
})
export class AuthorRefLookupService implements RefLookupService {
  constructor(
    private _biblioService: BiblioService,
    private _utilService: BiblioUtilService
  ) {}

  lookup(filter: RefLookupFilter, options?: any): Observable<any[]> {
    return this._biblioService
      .getAuthors({
        pageNumber: 1,
        pageSize: filter.limit,
        last: filter.text,
      })
      .pipe(map((p) => p.items));
  }

  getName(item?: Author): string {
    return this._utilService.authorToString(item || null);
  }
}
