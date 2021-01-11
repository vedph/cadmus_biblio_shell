import { Injectable } from '@angular/core';
import { Container, Work } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BiblioUtilService {

  /**
   * Return a string representation for the specified work or container.
   * @param work Work or container.
   * @returns String.
   */
  public workToString(work?: Work | Container): string {
    if (!work) {
      return '';
    }
    const sb: string[] = [];
    if (work.authors?.length) {
      for (let i = 0; i < work.authors.length; i++) {
        if (i > 0) {
          sb.push(' & ');
        }
        sb.push(work.authors[i].last);
      }
    }

    if (work.title) {
      sb.push(' - ');
      sb.push(work.title);
    }

    if ((work as Container).number) {
      sb.push(' ');
      sb.push((work as Container)?.number || '');
    }

    if (work.yearPub) {
      sb.push(', ');
      sb.push(work.yearPub.toString());
    }
    return sb.join('');
  }
}
