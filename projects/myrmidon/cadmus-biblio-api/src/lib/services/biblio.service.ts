import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ErrorService, DataPage, EnvService } from '@myrmidon/cadmus-core';
import { Observable, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { Author } from '@myrmidon/cadmus-biblio-core';

export interface AuthorFilter {
  pageNumber: number;
  pageSize: number;
  last?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BiblioService {
  constructor(
    private _http: HttpClient,
    private _error: ErrorService,
    private _env: EnvService
  ) {}

  public getAuthors(filter: AuthorFilter): Observable<DataPage<Author>> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('pageNumber', filter.pageNumber.toString());
    httpParams = httpParams.set('pageSize', filter.pageSize.toString());
    if (filter.last) {
      httpParams = httpParams.set('last', filter.last);
    }
    return this._http
      .get<DataPage<Author>>(`${this._env.apiUrl}/authors`, {
        params: httpParams,
      })
      .pipe(retry(3), catchError(this._error.handleError));
  }

  public getAuthor(id: string): Observable<Author> {
    return this._http
      .get<Author>(`${this._env.apiUrl}/authors/${id}`)
      .pipe(retry(3), catchError(this._error.handleError));
  }

  public addAuthor(author: Author): Observable<Author> {
    return this._http
      .post<Author>(`${this._env.apiUrl}/authors`, author)
      .pipe(catchError(this._error.handleError));
  }

  public deleteAuthor(id: string): Observable<any> {
    return this._http
      .delete(`${this._env.apiUrl}/authors/${id}`)
      .pipe(catchError(this._error.handleError));
  }

  public pruneAuthors(): Observable<any> {
    return this._http
      .delete(`${this._env.apiUrl}/unused/authors`)
      .pipe(catchError(this._error.handleError));
  }
}
