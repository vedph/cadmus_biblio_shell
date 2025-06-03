import { Component } from '@angular/core';

import { take } from 'rxjs';

import { MatCardModule } from '@angular/material/card';

import { ThesaurusService } from '@myrmidon/cadmus-api';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { WorkListComponent } from '../../../projects/myrmidon/cadmus-biblio-ui/src/public-api';

@Component({
  selector: 'cadmus-biblio-page',
  imports: [MatCardModule, WorkListComponent],
  templateUrl: './biblio-page.component.html',
  styleUrls: ['./biblio-page.component.scss'],
})
export class BiblioPageComponent {
  public langEntries: ThesaurusEntry[] | undefined;
  public roleEntries: ThesaurusEntry[] | undefined;
  public workTagEntries: ThesaurusEntry[] | undefined;

  constructor(thesService: ThesaurusService) {
    thesService
      .getThesauriSet([
        'ext-biblio-languages',
        'ext-biblio-author-roles',
        'ext-biblio-work-tags',
      ])
      .pipe(take(1))
      .subscribe((set) => {
        this.langEntries = set['ext-biblio-languages']?.entries;
        this.roleEntries = set['ext-biblio-author-roles']?.entries;
        this.workTagEntries = set['ext-biblio-work-tags']?.entries;
      });
  }
}
