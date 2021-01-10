import { Injectable } from '@angular/core';
import { WorkBase, WorkAuthor, Container } from '../models';

@Injectable({
  providedIn: 'root',
})
export class WorkKeyService {
  /**
   * Build the key for the specified work or container.
   * @param work The work or container to build the key for.
   * @returns The key.
   */
  public buildKey(work: WorkBase): string {
    if (!work) {
      return '';
    }
    const sb: string[] = [];

    // authors
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
          .map((a) => (a.suffix ? `${a.last} ${a.suffix}` : a.last))
          .join(' & ')
      );
    }

    // number if any
    if ((work as Container)?.number) {
      sb.push(' ');
      sb.push((work as Container).number || '');
    }

    // year
    sb.push(' ');
    sb.push((work.yearPub || 0).toString());

    return sb.join('');
  }
}
