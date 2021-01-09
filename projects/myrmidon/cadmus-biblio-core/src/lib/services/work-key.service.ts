import { Injectable } from '@angular/core';
import { WorkBase } from '../models';

@Injectable({
  providedIn: 'root',
})
export class WorkKeyService {
  public buildKey(work: WorkBase): string {
    if (!work) {
      return '';
    }
    const sb: string[] = [];
    if (work.authors?.length) {
      const lastNames = work.authors.map((a) => a.last);
      lastNames.sort();
      sb.push(lastNames.join(' & '));
    }
    sb.push(' ');
    sb.push((work.yearPub || 0).toString());

    return sb.join('');
  }
}
