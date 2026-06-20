import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';

import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import {
  BiblioUtilService,
  Container,
  Work,
} from '@myrmidon/cadmus-biblio-core';
import {
  RefLookupFilter,
  RefLookupService,
} from '@myrmidon/cadmus-refs-lookup';

export interface WorkLookupFilter extends RefLookupFilter {
  container?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class WorkRefLookupService implements RefLookupService {
  constructor(
    private _biblioService: BiblioService,
    private _biblioUtil: BiblioUtilService,
  ) {}

  public readonly id = 'biblio-work';

  public getById(id: string): Observable<any | undefined> {
    if (!id) {
      return of(undefined);
    }
    return this._biblioService.getWork(id);
  }

  public lookup(filter: WorkLookupFilter, options?: any): Observable<any[]> {
    console.log('work lookup', filter);
    if (filter.container) {
      return this._biblioService
        .getContainers({
          pageNumber: 1,
          pageSize: filter.limit,
          matchAny: true,
          title: filter.text,
          lastName: filter.text,
        })
        .pipe(map((p) => p.items));
    } else {
      return this._biblioService
        .getWorks({
          pageNumber: 1,
          pageSize: filter.limit,
          matchAny: true,
          title: filter.text,
          lastName: filter.text,
        })
        .pipe(map((p) => p.items));
    }
  }

  getName(item?: Container | Work): string {
    return this._biblioUtil.workToString(item);
  }
}
