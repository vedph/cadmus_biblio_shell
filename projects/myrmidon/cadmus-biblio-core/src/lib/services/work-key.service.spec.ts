import { TestBed } from '@angular/core/testing';

import { WorkKeyService } from './work-key.service';

describe('WorkKeyService', () => {
  let service: WorkKeyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkKeyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
