import { TestBed } from '@angular/core/testing';

import { AuthorRefLookupService } from './author-ref-lookup.service';

describe('AuthorRefLookupService', () => {
  let service: AuthorRefLookupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthorRefLookupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
