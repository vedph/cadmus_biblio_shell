import { Component, Input } from '@angular/core';
import {
  BiblioUtilService,
  Container,
  Work,
  WorkAuthor,
} from '@myrmidon/cadmus-biblio-core';

@Component({
  selector: 'biblio-work-details',
  templateUrl: './work-details.component.html',
  styleUrls: ['./work-details.component.css'],
})
export class WorkDetailsComponent {
  private _work: Work | Container | undefined;
  public w: Work | undefined;
  public c: Container | undefined;

  @Input()
  public get work(): Work | Container | undefined {
    return this._work;
  }
  public set work(value: Work | Container | undefined) {
    if (this._work === value) {
      return;
    }
    this._work = value;
    this.w = value;
    this.c = value;
  }

  constructor(private _utilService: BiblioUtilService) {}

  public authorsToString(authors: WorkAuthor[] | undefined): string {
    if (!authors) {
      return '';
    }
    return authors.map((a) => this._utilService.authorToString(a)).join('; ');
  }
}
