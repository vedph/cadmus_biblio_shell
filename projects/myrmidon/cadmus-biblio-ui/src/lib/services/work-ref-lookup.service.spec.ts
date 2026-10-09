import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { Work, WorkInfo } from '@myrmidon/cadmus-biblio-core';

import { WorkRefLookupService } from './work-ref-lookup.service';

const WORK: Work = {
  id: 'w1',
  key: 'Doe 2000',
  type: 'book',
  title: 'Alpha',
  language: 'eng',
  yearPub: 2000,
  authors: [{ first: 'John', last: 'Doe' }],
};

const INFOS: WorkInfo[] = [
  {
    isContainer: false,
    id: 'w1',
    key: 'Doe 2000',
    authors: [],
    type: 'book',
    title: 'Alpha',
    language: 'eng',
    edition: 1,
    yearPub: 2000,
    placePub: '',
  },
];

describe('WorkRefLookupService', () => {
  let service: WorkRefLookupService;
  let biblio: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    const page = { pageNumber: 1, pageSize: 3, total: 1, items: INFOS };
    biblio = {
      getWork: vi.fn(() => of(WORK)),
      getWorks: vi.fn(() => of(page)),
      getContainers: vi.fn(() => of(page)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: BiblioService, useValue: biblio }],
    });
    service = TestBed.inject(WorkRefLookupService);
  });

  it('should be created with its ID', () => {
    expect(service).toBeTruthy();
    expect(service.id).toBe('biblio-work');
  });

  it('getById should return undefined for an empty ID', async () => {
    expect(await firstValueFrom(service.getById(''))).toBeUndefined();
    expect(biblio['getWork']).not.toHaveBeenCalled();
  });

  it('getById should get the work', async () => {
    expect(await firstValueFrom(service.getById('w1'))).toEqual(WORK);
    expect(biblio['getWork']).toHaveBeenCalledWith('w1');
  });

  it('lookup should match works by title or last name', async () => {
    const items = await firstValueFrom(
      service.lookup({ limit: 3, text: 'al' })
    );
    expect(items).toEqual(INFOS);
    expect(biblio['getWorks']).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 3,
      matchAny: true,
      title: 'al',
      lastName: 'al',
    });
    expect(biblio['getContainers']).not.toHaveBeenCalled();
  });

  it('lookup should match containers when requested', async () => {
    await firstValueFrom(
      service.lookup({ limit: 3, text: 'jo', container: true })
    );
    expect(biblio['getContainers']).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 3,
      matchAny: true,
      title: 'jo',
      lastName: 'jo',
    });
    expect(biblio['getWorks']).not.toHaveBeenCalled();
  });

  it('getName should render the work', () => {
    expect(service.getName(WORK)).toBe('Doe - Alpha, 2000');
    expect(service.getName(undefined)).toBe('');
  });
});
