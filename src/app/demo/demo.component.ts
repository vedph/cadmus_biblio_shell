import { Component, OnInit } from '@angular/core';
import { WorkFilter } from '@myrmidon/cadmus-biblio-api';
import { Author, Container, Keyword, Work, WorkAuthor, WorkBase } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { WorkFilterComponent } from 'projects/myrmidon/cadmus-biblio-ui/src/public-api';

@Component({
  selector: 'biblio-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css'],
})
export class DemoComponent implements OnInit {
  public work: WorkBase | undefined;
  public container: WorkBase | undefined;

  public author: Author | undefined;

  public authors: WorkAuthor[] | undefined;
  public roleEntries: ThesaurusEntry[];

  public keyword: Keyword | undefined;

  public keywords: Keyword[] | undefined;
  public langEntries: ThesaurusEntry[];

  public editedWork: Work | Container | undefined;

  public filter: WorkFilter | undefined;

  public detWork: Work | Container | undefined;

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

  public onAuthorChange(author: Author): void {
    this.author = author;
  }

  public onAuthorsChange(authors: WorkAuthor[]): void {
    this.authors = authors;
  }

  public onKeywordChange(keyword: Keyword): void {
    this.keyword = keyword;
  }

  public onKeywordsChange(keywords: Keyword[]): void {
    this.keywords = keywords;
  }

  public onEditedWorkChange(work: Work | Container): void {
    this.editedWork = work;
  }

  public onFilterChange(filter: WorkFilter): void {
    this.filter = filter;
  }

  public onWorkChangeForDetails(work: Work | Container): void {
    this.detWork = work;
  }
}
