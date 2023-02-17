import { TestBed } from '@angular/core/testing';

import { WorkRefLookupService } from './work-ref-lookup.service';

describe('WorkRefLookupService', () => {
  let service: WorkRefLookupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkRefLookupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
