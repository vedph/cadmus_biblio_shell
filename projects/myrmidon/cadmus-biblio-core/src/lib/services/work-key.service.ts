import { Injectable } from '@angular/core';
import { Container, WorkAuthor } from '../models';

@Injectable({
  providedIn: 'root',
})
export class WorkKeyService {
  /**
   * Build the key for the specified work or container.
   * @param work The work or container to build the key for.
   * @returns The key.
   */
  public buildKey(work: Container): string {
    if (!work) {
      return '';
    }
    const sb: string[] = [];

    // authors (max 3)
    if (work.authors?.length) {
      // sort by ordinal, last, suffix
      const sorted = [...work.authors];
      sorted.sort((a: WorkAuthor, b: WorkAuthor) => {
        if (a.ordinal !== b.ordinal) {
          return (a.ordinal || 0) - (b.ordinal || 0);
        } else {
          const n = a.last.localeCompare(b.last);
          if (n !== 0) {
            return n;
          }
          return (a.suffix || '').localeCompare(b.suffix || '');
        }
      });
      // pick last, or last + space + suffix
      sb.push(
        sorted
          .slice(0, 3)
          .map((a) => (a.suffix ? `${a.last} ${a.suffix}` : a.last))
          .join(' & ')
      );

      if (work.authors.length > 3) {
        sb.push(' & al.');
      }
    }

    // number if any
    if (work?.number) {
      sb.push(' ');
      sb.push(work.number || '');
    }

    // year
    sb.push(' ');
    sb.push((work.yearPub || 0).toString());

    const key = sb.join('');
    return key.length > 300? key.substring(0, 300) : key;
  }
}
