import { TestBed } from '@angular/core/testing';

import { Container, Work, WorkInfo } from '../models';
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

  describe('workToString', () => {
    it('should return empty for null or undefined', () => {
      expect(service.workToString(null)).toBe('');
      expect(service.workToString(undefined)).toBe('');
    });

    it('should render authors, title, number and years', () => {
      const work: Container = {
        key: 'k',
        type: 'journal',
        title: 'Journal',
        language: 'eng',
        number: '3',
        yearPub: 2000,
        yearPub2: 2001,
        authors: [
          { first: 'John', last: 'Doe' },
          { first: 'Jane', last: 'Roe' },
        ],
      };
      expect(service.workToString(work)).toBe(
        'Doe & Roe - Journal 3, 2000-2001'
      );
    });

    it('should omit missing parts', () => {
      const work: Work = {
        key: 'k',
        type: 'book',
        title: '',
        language: 'eng',
        yearPub2: 2001,
      };
      expect(service.workToString(work)).toBe('');
    });

    it('should render the title only', () => {
      const work: Work = {
        key: 'k',
        type: 'book',
        title: 'Alpha',
        language: 'eng',
      };
      expect(service.workToString(work)).toBe(' - Alpha');
    });
  });

  describe('workInfoToString', () => {
    const info: WorkInfo = {
      isContainer: false,
      id: '1',
      key: 'k',
      authors: [
        { first: 'John', last: 'Doe' },
        { first: 'Jane', last: 'Roe' },
      ],
      type: 'book',
      title: 'Book',
      language: 'eng',
      edition: 1,
      yearPub: 1990,
      placePub: 'Rome',
      number: '2',
    };

    it('should return empty for null or undefined', () => {
      expect(service.workInfoToString(null)).toBe('');
      expect(service.workInfoToString(undefined)).toBe('');
    });

    it('should render authors, title, number and year', () => {
      expect(service.workInfoToString(info)).toBe('Doe & Roe - Book 2, 1990');
    });

    it('should omit missing parts', () => {
      expect(
        service.workInfoToString({
          ...info,
          authors: [],
          number: undefined,
          yearPub: 0,
        })
      ).toBe(' - Book');
    });
  });

  describe('authorToString', () => {
    it('should return empty for null', () => {
      expect(service.authorToString(null)).toBe('');
    });

    it('should render last name only', () => {
      expect(service.authorToString({ first: '', last: 'Doe' })).toBe('Doe');
    });

    it('should render last, suffix, first and role', () => {
      expect(
        service.authorToString({
          first: 'John',
          last: 'Doe',
          suffix: 'jr.',
          role: 'editor',
        })
      ).toBe('Doe jr., John (editor)');
    });
  });
});
