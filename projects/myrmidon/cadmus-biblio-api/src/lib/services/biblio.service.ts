import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ErrorService, DataPage, EnvService } from '@myrmidon/cadmus-core';
import { Observable, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import {
  Author,
  PagingOptions,
  WorkType,
  Keyword,
  Container,
} from '@myrmidon/cadmus-biblio-core';

export interface AuthorFilter extends PagingOptions {
  last?: string;
}

export interface WorkTypeFilter extends PagingOptions {
  name?: string;
}

export interface KeywordFilter extends PagingOptions {
  language?: string;
  value?: string;
}

export interface WorkFilter extends PagingOptions {
  matchAny?: boolean;
  type?: string;
  lastName?: string;
  language?: string;
  title?: string;
  containerTitle?: string;
  keyword?: string;
  yearPubMin?: number;
  yearPubMax?: number;
  key?: string;
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

  public getWorkTypes(filter: WorkTypeFilter): Observable<DataPage<WorkType>> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('pageNumber', filter.pageNumber.toString());
    httpParams = httpParams.set('pageSize', filter.pageSize.toString());
    if (filter.name) {
      httpParams = httpParams.set('name', filter.name);
    }
    return this._http
      .get<DataPage<WorkType>>(`${this._env.apiUrl}/work-types`, {
        params: httpParams,
      })
      .pipe(retry(3), catchError(this._error.handleError));
  }

  public getWorkType(id: string): Observable<WorkType> {
    return this._http
      .get<WorkType>(`${this._env.apiUrl}/work-types/${id}`)
      .pipe(retry(3), catchError(this._error.handleError));
  }

  public addWorkType(type: WorkType): Observable<WorkType> {
    return this._http
      .post<WorkType>(`${this._env.apiUrl}/work-types`, type)
      .pipe(catchError(this._error.handleError));
  }

  public deleteWorkType(id: string): Observable<any> {
    return this._http
      .delete(`${this._env.apiUrl}/work-types/${id}`)
      .pipe(catchError(this._error.handleError));
  }

  public getKeywords(filter: KeywordFilter): Observable<DataPage<Keyword>> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('pageNumber', filter.pageNumber.toString());
    httpParams = httpParams.set('pageSize', filter.pageSize.toString());
    if (filter.language) {
      httpParams = httpParams.set('language', filter.language);
    }
    if (filter.value) {
      httpParams = httpParams.set('value', filter.value);
    }
    return this._http
      .get<DataPage<Keyword>>(`${this._env.apiUrl}/keywords`, {
        params: httpParams,
      })
      .pipe(retry(3), catchError(this._error.handleError));
  }

  public getKeyword(id: number): Observable<Keyword> {
    return this._http
      .get<Keyword>(`${this._env.apiUrl}/keywords/${id}`)
      .pipe(retry(3), catchError(this._error.handleError));
  }

  public addKeyword(keyword: Keyword): Observable<Keyword> {
    return this._http
      .post<Keyword>(`${this._env.apiUrl}/keywords`, keyword)
      .pipe(catchError(this._error.handleError));
  }

  private getWorkFilterParams(filter: WorkFilter): HttpParams {
    let httpParams = new HttpParams();

    httpParams = httpParams.set('pageNumber', filter.pageNumber.toString());
    httpParams = httpParams.set('pageSize', filter.pageSize.toString());

    if (filter.matchAny) {
      httpParams = httpParams.set('matchAny', 'true');
    }
    if (filter.type) {
      httpParams = httpParams.set('type', filter.type);
    }
    if (filter.lastName) {
      httpParams = httpParams.set('lastName', filter.lastName);
    }
    if (filter.language) {
      httpParams = httpParams.set('language', filter.language);
    }
    if (filter.title) {
      httpParams = httpParams.set('title', filter.title);
    }
    if (filter.containerTitle) {
      httpParams = httpParams.set('containerTitle', filter.containerTitle);
    }
    if (filter.keyword) {
      httpParams = httpParams.set('keyword', filter.keyword);
    }
    if (filter.yearPubMin) {
      httpParams = httpParams.set('yearPubMin', filter.yearPubMin.toString());
    }
    if (filter.yearPubMax) {
      httpParams = httpParams.set('yearPubMax', filter.yearPubMax.toString());
    }
    if (filter.key) {
      httpParams = httpParams.set('key', filter.key);
    }

    return httpParams;
  }

  public getContainers(filter: WorkFilter): Observable<DataPage<Container>> {
    const httpParams = this.getWorkFilterParams(filter);
    return this._http
      .get<DataPage<Container>>(`${this._env.apiUrl}/containers`, {
        params: httpParams,
      })
      .pipe(retry(3), catchError(this._error.handleError));
  }

  public getContainer(id: string): Observable<Container> {
    return this._http
      .get<Container>(`${this._env.apiUrl}/containers/${id}`)
      .pipe(retry(3), catchError(this._error.handleError));
  }

  public addContainer(container: Container): Observable<Container> {
    return this._http
      .post<Container>(`${this._env.apiUrl}/containers`, container)
      .pipe(catchError(this._error.handleError));
  }

  public deleteContainer(id: string): Observable<any> {
    return this._http
      .delete(`${this._env.apiUrl}/containers/${id}`)
      .pipe(catchError(this._error.handleError));
  }
}
