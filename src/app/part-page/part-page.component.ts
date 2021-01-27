import { Component, OnInit } from '@angular/core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

@Component({
  selector: 'biblio-part-page',
  templateUrl: './part-page.component.html',
  styleUrls: ['./part-page.component.css'],
})
export class PartPageComponent implements OnInit {
  public roleEntries: ThesaurusEntry[] | undefined;
  public langEntries: ThesaurusEntry[] | undefined;
  public workTagEntries: ThesaurusEntry[] | undefined;

  constructor() {
    this.roleEntries = [
      { id: '-', value: '---' },
      { id: 'trs', value: 'translator' },
      { id: 'org', value: 'organization' },
    ];

    this.langEntries = [
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
}
