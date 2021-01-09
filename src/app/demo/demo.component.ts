import { Component, OnInit } from '@angular/core';
import { Keyword, WorkAuthor, WorkBase } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

@Component({
  selector: 'biblio-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css'],
})
export class DemoComponent implements OnInit {
  public work: WorkBase | undefined;
  public container: WorkBase | undefined;

  public authors: WorkAuthor[] | undefined;
  public roleEntries: ThesaurusEntry[];

  public keywords: Keyword[] | undefined;
  public langEntries: ThesaurusEntry[];

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
  }

  ngOnInit(): void {}

  public onWorkChange(work: WorkBase): void {
    this.work = work;
  }

  public onContainerChange(container: WorkBase): void {
    this.container = container;
  }

  public onAuthorsChange(authors: WorkAuthor[]): void {
    this.authors = authors;
  }

  public onKeywordsChange(keywords: Keyword[]): void {
    this.keywords = keywords;
  }
}
