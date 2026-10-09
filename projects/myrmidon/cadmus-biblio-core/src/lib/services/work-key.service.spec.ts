import { TestBed } from '@angular/core/testing';

import { Container, WorkAuthor } from '../models';
import { WorkKeyService } from './work-key.service';

function container(props: Partial<Container> = {}): Container {
  return {
    key: '',
    type: 'book',
    title: 'Title',
    language: 'eng',
    ...props,
  };
}

function author(last: string, props: Partial<WorkAuthor> = {}): WorkAuthor {
  return { first: 'F', last, ...props };
}

describe('WorkKeyService', () => {
  let service: WorkKeyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkKeyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty for a null work', () => {
    expect(service.buildKey(null as unknown as Container, false)).toBe('');
  });

  it('should build only the year when there are no authors', () => {
    expect(service.buildKey(container({ yearPub: 2020 }), false)).toBe(
      ' 2020'
    );
  });

  it('should use year 0 when the year is missing', () => {
    expect(service.buildKey(container({ authors: [author('Doe')] }), false)).toBe(
      'Doe 0'
    );
  });

  it('should join up to 3 authors sorted by ordinal', () => {
    const key = service.buildKey(
      container({
        yearPub: 1999,
        authors: [
          author('Zeta', { ordinal: 1 }),
          author('Alpha', { ordinal: 3 }),
          author('Beta', { ordinal: 2 }),
        ],
      }),
      false
    );
    expect(key).toBe('Zeta & Beta & Alpha 1999');
  });

  it('should sort by last name and suffix when ordinals are equal', () => {
    const key = service.buildKey(
      container({
        yearPub: 2000,
        authors: [
          author('Smith', { suffix: 'jr.' }),
          author('Doe'),
          author('Smith'),
        ],
      }),
      false
    );
    expect(key).toBe('Doe & Smith & Smith jr. 2000');
  });

  it('should treat a missing ordinal as 0 and fall back to last name', () => {
    const key = service.buildKey(
      container({
        yearPub: 2000,
        authors: [author('Zeta', { ordinal: 0 }), author('Alpha')],
      }),
      false
    );
    expect(key).toBe('Alpha & Zeta 2000');
  });

  it('should append "& al." when there are more than 3 authors', () => {
    const key = service.buildKey(
      container({
        yearPub: 2001,
        authors: [author('A'), author('B'), author('C'), author('D')],
      }),
      false
    );
    expect(key).toBe('A & B & C & al. 2001');
  });

  it('should not alter the order of the original authors', () => {
    const authors = [author('B'), author('A')];
    service.buildKey(container({ authors }), false);
    expect(authors.map((a) => a.last)).toEqual(['B', 'A']);
  });

  it('should include the number for containers only', () => {
    const c = container({
      yearPub: 2010,
      number: '12',
      authors: [author('Doe')],
    });
    expect(service.buildKey(c, true)).toBe('Doe 12 2010');
    expect(service.buildKey(c, false)).toBe('Doe 2010');
  });

  it('should truncate the key to 300 characters', () => {
    const key = service.buildKey(
      container({ yearPub: 2000, authors: [author('x'.repeat(400))] }),
      false
    );
    expect(key.length).toBe(300);
  });
});
