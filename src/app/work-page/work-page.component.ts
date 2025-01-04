import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { WorkListEntry } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { WorkListComponent } from '../../../projects/myrmidon/cadmus-biblio-ui/src/public-api';

@Component({
  selector: 'biblio-work-page',
  imports: [CommonModule, MatCardModule, WorkListComponent],
  templateUrl: './work-page.component.html',
  styleUrls: ['./work-page.component.css'],
})
export class WorkPageComponent implements OnInit {
  public roleEntries: ThesaurusEntry[];
  public langEntries: ThesaurusEntry[];
  public workTagEntries: ThesaurusEntry[];

  public entries: WorkListEntry[];

  constructor() {
    this.entries = [];

    this.roleEntries = [
      { id: '-', value: '---' },
      { id: 'trs', value: 'translator' },
      { id: 'org', value: 'organization' },
    ];

    this.langEntries = [
      { id: '-', value: '---' },
      { id: 'eng', value: 'English' },
      { id: 'deu', value: 'German' },
      { id: 'ita', value: 'Italian' },
      { id: 'fra', value: 'French' },
      { id: 'spa', value: 'Spanish' },
    ];

    this.workTagEntries = [
      { id: 'history', value: 'history of studies' },
      { id: 'method', value: 'methodology' },
      { id: 'algorithm', value: 'algorithms' },
    ];
  }

  ngOnInit(): void {}

  public onEntriesChange(entries: WorkListEntry[]): void {
    this.entries = entries;
  }
}
