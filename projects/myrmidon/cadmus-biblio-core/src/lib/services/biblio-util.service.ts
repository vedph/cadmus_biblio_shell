import { Injectable } from '@angular/core';
import { Author, Container, Work, WorkAuthor, WorkInfo } from '../models';

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

  /**
   * Return a string representation for the specified work info.
   * @param work Work info.
   * @returns String.
   */
  public workInfoToString(work?: WorkInfo): string {
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

    if (work.number) {
      sb.push(' ');
      sb.push(work.number);
    }

    if (work.yearPub) {
      sb.push(', ');
      sb.push(work.yearPub.toString());
    }
    return sb.join('');
  }

  /**
   * Return a string representation for the specified author.
   * @param author Author or work's author.
   * @returns String.
   */
  public authorToString(author: Author | WorkAuthor): string {
    if (!author) {
      return '';
    }
    const sb: string[] = [];
    sb.push(author.last);
    if (author.suffix) {
      sb.push(' ');
      sb.push(author.suffix);
    }
    if (author.first) {
      sb.push(', ');
      sb.push(author.first);
    }
    if ((author as WorkAuthor).role) {
      sb.push(' (');
      sb.push((author as WorkAuthor)?.role || '');
      sb.push(')');
    }
    return sb.join('');
  }
}
