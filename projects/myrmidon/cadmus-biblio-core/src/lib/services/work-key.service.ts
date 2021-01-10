import { Injectable } from '@angular/core';
import { WorkBase, WorkAuthor } from '../models';

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
    if (work.authors?.length) {
      const sorted = [...work.authors];
      sorted.sort((a: WorkAuthor, b: WorkAuthor) => {
        if (a.ordinal !== b.ordinal) {
          return (a.ordinal || 0) - (b.ordinal || 0);
        } else {
          return a.last.localeCompare(b.last);
        }
      });
      sb.push(sorted.map((a) => a.last).join(' & '));
    }
    sb.push(' ');
    sb.push((work.yearPub || 0).toString());

    return sb.join('');
  }
}
