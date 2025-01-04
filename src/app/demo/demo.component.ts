import { Component } from '@angular/core';
import { WorkFilter } from '@myrmidon/cadmus-biblio-api';
import {
  Author,
  Container,
  Keyword,
  Work,
  WorkAuthor,
} from '@myrmidon/cadmus-biblio-core';
import {
  AuthorRefLookupService,
  WorkRefLookupService,
} from '@myrmidon/cadmus-biblio-ui';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

@Component({
  selector: 'biblio-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css'],
  standalone: false,
})
export class DemoComponent {
  public work: Work | undefined;
  public container: Container | undefined;

  public author: Author | undefined;

  public authors: WorkAuthor[] | undefined;
  public roleEntries: ThesaurusEntry[];

  public keyword: Keyword | undefined;

  public keywords: Keyword[] | undefined;
  public langEntries: ThesaurusEntry[];

  public editedWork: Work | Container | undefined;

  public filter: WorkFilter | undefined;

  public detWork: Work | Container | undefined;

  constructor(
    public authorLookupService: AuthorRefLookupService,
    public workLookupService: WorkRefLookupService
  ) {
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

  public onWorkChange(work: unknown): void {
    this.work = work as Work | Container;
  }

  public onContainerChange(container: unknown): void {
    this.container = container as Container;
  }

  public onAuthorChange(author: unknown): void {
    this.author = author as Author;
  }

  public onAuthorsChange(authors: unknown): void {
    this.authors = authors as WorkAuthor[];
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

  public onWorkChangeForDetails(work: unknown): void {
    this.detWork = work as Work | Container;
  }
}
