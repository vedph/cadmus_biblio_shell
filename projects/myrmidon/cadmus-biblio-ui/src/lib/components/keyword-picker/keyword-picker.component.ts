import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { BiblioService, KeywordFilter } from '@myrmidon/cadmus-biblio-api';
import { Keyword } from '@myrmidon/cadmus-biblio-core';


@Component({
  selector: 'biblio-keyword-picker',
  templateUrl: './keyword-picker.component.html',
  styleUrls: ['./keyword-picker.component.css'],
})
export class KeywordPickerComponent implements OnInit {
  /**
   * The maximum count of works to retrieve. Default=10.
   */
  @Input()
  public limit: number;

  /**
   * The label attached to this picker. Default=work or container.
   */
  @Input()
  public label: string;

  /**
   * Fired when a keyword is selected.
   */
  @Output()
  public keywordChange: EventEmitter<Keyword>;
  public form: UntypedFormGroup;
  public lookup: UntypedFormControl;
  public keywords$: Observable<Keyword[]> | undefined;
  public keyword: Keyword | undefined;

  constructor(formBuilder: UntypedFormBuilder, private _biblioService: BiblioService) {
    this.limit = 10;
    this.label = 'keyword/lang:keyword';
    this.keywordChange = new EventEmitter<Keyword>();
    // form
    this.lookup = formBuilder.control(null);
    this.form = formBuilder.group({
      lookup: this.lookup,
    });
  }

  private getFilter(filterText: string): KeywordFilter {
    // you can specify language as language:value
    let language = undefined;
    let value = undefined;
    const i = filterText.indexOf(':');
    if (i > -1) {
      language = filterText.substring(0, i);
      value = filterText.substring(i + 1);
    } else {
      value = filterText;
    }

    return {
      pageNumber: 1,
      pageSize: this.limit,
      language: language,
      value: value,
    };
  }

  ngOnInit(): void {
    this.keywords$ = this.lookup.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value: Keyword | string) => {
        if (typeof value === 'string') {
          const filter = this.getFilter(value);
          return this._biblioService.getKeywords(filter).pipe(
            switchMap((p) => {
              return of(p.items as Keyword[]);
            })
          );
        } else {
          return of([value]);
        }
      })
    );
  }

  public clear(): void {
    this.keyword = undefined;
    this.lookup.setValue(null);
  }

  public keywordToString(keyword: Keyword): string {
    return keyword? `[${keyword.language}] ${keyword.value}` : '';
  }

  public pickKeyword(keyword: Keyword): void {
    this.keywordChange.emit(keyword);
    this.clear();
  }
}
