import { Component, OnInit } from '@angular/core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { ExtBibliographyPart, EXT_BIBLIOGRAPHY_PART_TYPEID } from '@myrmidon/cadmus-part-biblio-ui';
import { PartIdentity } from '@myrmidon/cadmus-ui';

@Component({
  selector: 'biblio-part-page',
  templateUrl: './part-page.component.html',
  styleUrls: ['./part-page.component.css'],
})
export class PartPageComponent implements OnInit {
  public identity: PartIdentity;
  public roleEntries: ThesaurusEntry[] | undefined;
  public langEntries: ThesaurusEntry[] | undefined;
  public workTagEntries: ThesaurusEntry[] | undefined;
  public scopeEntries: ThesaurusEntry[] | undefined;
  public data?: ExtBibliographyPart;

  constructor() {
    this.identity = {
      itemId: 'aa5866f2-4b32-4867-a051-ee9b1b28736f',
      partId: '6d484ec7-d4be-4b9c-a66a-bdc0f92e615b',
      typeId: EXT_BIBLIOGRAPHY_PART_TYPEID,
      roleId: null,
    };
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

    this.scopeEntries = [
      { id: 'A', value: 'alpha' },
      { id: 'B', value: 'beta' },
    ];
  }

  ngOnInit(): void {}

  public onDataChange(part: ExtBibliographyPart): void {
    this.data = part;
  }
}
