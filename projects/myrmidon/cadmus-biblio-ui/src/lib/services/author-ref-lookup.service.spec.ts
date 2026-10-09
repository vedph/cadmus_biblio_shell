import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { Author } from '@myrmidon/cadmus-biblio-core';

import { AuthorRefLookupService } from './author-ref-lookup.service';

const AUTHORS: Author[] = [
  { id: 'a1', first: 'John', last: 'Doe' },
  { id: 'a2', first: 'Jane', last: 'Doe', suffix: 'jr.' },
];

describe('AuthorRefLookupService', () => {
  let service: AuthorRefLookupService;
  let biblio: { getAuthor: ReturnType<typeof vi.fn>; getAuthors: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    biblio = {
      getAuthor: vi.fn(() => of(AUTHORS[0])),
      getAuthors: vi.fn(() =>
        of({ pageNumber: 1, pageSize: 5, total: 2, items: AUTHORS })
      ),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: BiblioService, useValue: biblio }],
    });
    service = TestBed.inject(AuthorRefLookupService);
  });

  it('should be created with its ID', () => {
    expect(service).toBeTruthy();
    expect(service.id).toBe('biblio-author');
  });

  it('getById should return undefined for an empty ID', async () => {
    expect(await firstValueFrom(service.getById(''))).toBeUndefined();
    expect(biblio.getAuthor).not.toHaveBeenCalled();
  });

  it('getById should get the author', async () => {
    expect(await firstValueFrom(service.getById('a1'))).toEqual(AUTHORS[0]);
    expect(biblio.getAuthor).toHaveBeenCalledWith('a1');
  });

  it('lookup should get authors by last name', async () => {
    const items = await firstValueFrom(
      service.lookup({ limit: 5, text: 'do' })
    );
    expect(items).toEqual(AUTHORS);
    expect(biblio.getAuthors).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 5,
      last: 'do',
    });
  });

  it('getName should render the author', () => {
    expect(service.getName(AUTHORS[1])).toBe('Doe jr., Jane');
    expect(service.getName(undefined)).toBe('');
  });
});
