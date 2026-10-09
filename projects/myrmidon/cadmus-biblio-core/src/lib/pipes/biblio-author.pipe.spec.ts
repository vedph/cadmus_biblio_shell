import { TestBed } from '@angular/core/testing';

import { BiblioUtilService } from '../services/biblio-util.service';
import { BiblioAuthorPipe } from './biblio-author.pipe';

describe('BiblioAuthorPipe', () => {
  let pipe: BiblioAuthorPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    pipe = new BiblioAuthorPipe(TestBed.inject(BiblioUtilService));
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should render an author', () => {
    expect(pipe.transform({ first: 'John', last: 'Doe', role: 'ed.' })).toBe(
      'Doe, John (ed.)'
    );
  });
});
