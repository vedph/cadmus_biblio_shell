import { TestBed } from '@angular/core/testing';

import { BiblioUtilService } from '../services/biblio-util.service';
import { BiblioWorkPipe } from './biblio-work.pipe';

describe('BiblioWorkPipe', () => {
  let pipe: BiblioWorkPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    pipe = new BiblioWorkPipe(TestBed.inject(BiblioUtilService));
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should render a work', () => {
    expect(
      pipe.transform({
        key: 'k',
        type: 'book',
        title: 'Book',
        language: 'eng',
        yearPub: 2000,
        authors: [{ first: 'John', last: 'Doe' }],
      })
    ).toBe('Doe - Book, 2000');
  });
});
