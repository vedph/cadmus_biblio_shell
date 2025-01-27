import { Component, computed, input, Input } from '@angular/core';
import { DatePipe } from '@angular/common';

import { HistoricalDatePipe } from '@myrmidon/cadmus-refs-historical-date';

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
  imports: [DatePipe, HistoricalDatePipe],
})
export class WorkDetailsComponent {
  public readonly work = input<Work | Container>();
  public readonly w = computed(() => this.work() as Work | undefined);
  public readonly c = computed(() => this.work() as Container | undefined);

  constructor(private _utilService: BiblioUtilService) {}

  public authorsToString(authors: WorkAuthor[] | undefined): string {
    if (!authors) {
      return '';
    }
    return authors.map((a) => this._utilService.authorToString(a)).join('; ');
  }
}
