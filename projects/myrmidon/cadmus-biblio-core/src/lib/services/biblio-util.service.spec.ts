import { TestBed } from '@angular/core/testing';

import { BiblioUtilService } from './biblio-util.service';

describe('BiblioUtilService', () => {
  let service: BiblioUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BiblioUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
