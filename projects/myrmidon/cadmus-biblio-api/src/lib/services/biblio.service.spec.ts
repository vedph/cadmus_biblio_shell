import { TestBed } from '@angular/core/testing';

import { BiblioService } from './biblio.service';

describe('BiblioService', () => {
  let service: BiblioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BiblioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
