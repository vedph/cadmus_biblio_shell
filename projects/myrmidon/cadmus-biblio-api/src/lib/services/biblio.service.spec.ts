import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { Container, Work } from '@myrmidon/cadmus-biblio-core';
import { EnvService } from '@myrmidon/ngx-tools';

import { BiblioService } from './biblio.service';

const API = 'http://test/api/';

describe('BiblioService', () => {
  let service: BiblioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: EnvService,
          useValue: { get: (key: string) => (key === 'biblioApiUrl' ? API : undefined) },
        },
      ],
    });
    service = TestBed.inject(BiblioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('authors', () => {
    it('getAuthors should send paging only when unfiltered', () => {
      const page = { pageNumber: 1, pageSize: 20, total: 0, items: [] };
      let result: unknown;
      service.getAuthors({ pageNumber: 1, pageSize: 20 }).subscribe((p) => (result = p));

      const req = http.expectOne((r) => r.url === API + 'authors');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toEqual(['pageNumber', 'pageSize']);
      expect(req.request.params.get('pageNumber')).toBe('1');
      expect(req.request.params.get('pageSize')).toBe('20');
      req.flush(page);
      expect(result).toEqual(page);
    });

    it('getAuthors should send last name filter', () => {
      service.getAuthors({ pageNumber: 2, pageSize: 10, last: 'doe' }).subscribe();
      const req = http.expectOne((r) => r.url === API + 'authors');
      expect(req.request.params.get('last')).toBe('doe');
      req.flush({});
    });

    it('getAuthor should GET by ID', () => {
      service.getAuthor('a1').subscribe();
      const req = http.expectOne(API + 'authors/a1');
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('addAuthor should POST', () => {
      const author = { first: 'John', last: 'Doe' };
      service.addAuthor(author).subscribe();
      const req = http.expectOne(API + 'authors');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(author);
      req.flush(author);
    });

    it('deleteAuthor should DELETE', () => {
      service.deleteAuthor('a1').subscribe();
      const req = http.expectOne(API + 'authors/a1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('pruneAuthors should DELETE unused', () => {
      service.pruneAuthors().subscribe();
      const req = http.expectOne(API + 'unused/authors');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('work types', () => {
    it('getWorkTypes should send name filter', () => {
      service.getWorkTypes({ pageNumber: 1, pageSize: 0, name: 'bo' }).subscribe();
      const req = http.expectOne((r) => r.url === API + 'work-types');
      expect(req.request.params.get('pageSize')).toBe('0');
      expect(req.request.params.get('name')).toBe('bo');
      req.flush({});
    });

    it('getWorkTypes should omit empty name', () => {
      service.getWorkTypes({ pageNumber: 1, pageSize: 0 }).subscribe();
      const req = http.expectOne((r) => r.url === API + 'work-types');
      expect(req.request.params.has('name')).toBe(false);
      req.flush({});
    });

    it('getWorkType should GET by ID', () => {
      service.getWorkType('book').subscribe();
      http.expectOne(API + 'work-types/book').flush({});
    });

    it('addWorkType should POST', () => {
      service.addWorkType({ id: 'book', name: 'Book' }).subscribe();
      const req = http.expectOne(API + 'work-types');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ id: 'book', name: 'Book' });
      req.flush({});
    });

    it('deleteWorkType should DELETE', () => {
      service.deleteWorkType('book').subscribe();
      const req = http.expectOne(API + 'work-types/book');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('keywords', () => {
    it('getKeywords should send language and value', () => {
      service
        .getKeywords({ pageNumber: 1, pageSize: 5, language: 'eng', value: 'x' })
        .subscribe();
      const req = http.expectOne((r) => r.url === API + 'keywords');
      expect(req.request.params.get('language')).toBe('eng');
      expect(req.request.params.get('value')).toBe('x');
      req.flush({});
    });

    it('getKeywords should omit empty filters', () => {
      service.getKeywords({ pageNumber: 1, pageSize: 5 }).subscribe();
      const req = http.expectOne((r) => r.url === API + 'keywords');
      expect(req.request.params.keys()).toEqual(['pageNumber', 'pageSize']);
      req.flush({});
    });

    it('getKeyword should GET by ID', () => {
      service.getKeyword(3).subscribe();
      http.expectOne(API + 'keywords/3').flush({});
    });

    it('addKeyword should POST', () => {
      service.addKeyword({ language: 'eng', value: 'x' }).subscribe();
      const req = http.expectOne(API + 'keywords');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('works and containers', () => {
    const fullFilter = {
      pageNumber: 3,
      pageSize: 15,
      matchAny: true,
      type: 'book',
      authorId: 'a1',
      lastName: 'doe',
      language: 'eng',
      title: 'alpha',
      containerId: 'c1',
      keyword: 'kw',
      yearPubMin: 1900,
      yearPubMax: 2000,
      datationMin: 1200,
      datationMax: 1300,
      key: 'k',
    };

    it('getWorks should send all the filter params', () => {
      service.getWorks(fullFilter).subscribe();
      const req = http.expectOne((r) => r.url === API + 'works');
      const p = req.request.params;
      expect(p.get('pageNumber')).toBe('3');
      expect(p.get('pageSize')).toBe('15');
      expect(p.get('matchAny')).toBe('true');
      expect(p.get('type')).toBe('book');
      expect(p.get('authorId')).toBe('a1');
      expect(p.get('lastName')).toBe('doe');
      expect(p.get('language')).toBe('eng');
      expect(p.get('title')).toBe('alpha');
      expect(p.get('containerId')).toBe('c1');
      expect(p.get('keyword')).toBe('kw');
      expect(p.get('yearPubMin')).toBe('1900');
      expect(p.get('yearPubMax')).toBe('2000');
      expect(p.get('datationMin')).toBe('1200');
      expect(p.get('datationMax')).toBe('1300');
      expect(p.get('key')).toBe('k');
      req.flush({});
    });

    it('getWorks should send only paging for an empty filter', () => {
      service.getWorks({ pageNumber: 1, pageSize: 20 }).subscribe();
      const req = http.expectOne((r) => r.url === API + 'works');
      expect(req.request.params.keys()).toEqual(['pageNumber', 'pageSize']);
      req.flush({});
    });

    it('getContainers should send the filter params', () => {
      service.getContainers(fullFilter).subscribe();
      const req = http.expectOne((r) => r.url === API + 'containers');
      expect(req.request.params.get('title')).toBe('alpha');
      expect(req.request.params.get('datationMax')).toBe('1300');
      req.flush({});
    });

    it('getWork should GET by ID', () => {
      service.getWork('w1').subscribe();
      http.expectOne(API + 'works/w1').flush({});
    });

    it('getContainer should GET by ID', () => {
      service.getContainer('c1').subscribe();
      http.expectOne(API + 'containers/c1').flush({});
    });

    it('addWork should POST', () => {
      const work = { key: '', type: 'book', title: 'T', language: 'eng' } as Work;
      service.addWork(work).subscribe();
      const req = http.expectOne(API + 'works');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(work);
      req.flush(work);
    });

    it('addContainer should POST', () => {
      const container = {
        key: '',
        type: 'journal',
        title: 'T',
        language: 'eng',
      } as Container;
      service.addContainer(container).subscribe();
      const req = http.expectOne(API + 'containers');
      expect(req.request.method).toBe('POST');
      req.flush(container);
    });

    it('deleteWork should DELETE', () => {
      service.deleteWork('w1').subscribe();
      const req = http.expectOne(API + 'works/w1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('deleteContainer should DELETE', () => {
      service.deleteContainer('c1').subscribe();
      const req = http.expectOne(API + 'containers/c1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('errors', () => {
    it('should retry GET requests 3 times before failing', () => {
      let error: unknown;
      service.getWork('w1').subscribe({ error: (e) => (error = e) });
      for (let i = 0; i < 4; i++) {
        http
          .expectOne(API + 'works/w1')
          .flush('boom', { status: 500, statusText: 'Server Error' });
      }
      expect(error).toBeTruthy();
    });

    it('should not retry POST requests', () => {
      let error: unknown;
      service
        .addAuthor({ first: 'a', last: 'b' })
        .subscribe({ error: (e) => (error = e) });
      http
        .expectOne(API + 'authors')
        .flush('bad', { status: 400, statusText: 'Bad Request' });
      expect(error).toBeTruthy();
    });
  });
});
