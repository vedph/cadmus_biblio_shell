import { Component, OnInit } from '@angular/core';
import { WorkAuthor, WorkBase } from '@myrmidon/cadmus-biblio-core';
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

  constructor() {
    this.roleEntries = [
      { id: '-', value: '---' },
      { id: 'trs', value: 'translator' },
      { id: 'org', value: 'organization' },
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
}
