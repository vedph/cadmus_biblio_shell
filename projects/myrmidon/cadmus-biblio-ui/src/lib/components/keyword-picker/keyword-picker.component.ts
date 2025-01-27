import { Component, EventEmitter, input, Input, OnInit, output, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import {
  MatAutocomplete,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

import { BiblioService, KeywordFilter } from '@myrmidon/cadmus-biblio-api';
import { Keyword } from '@myrmidon/cadmus-biblio-core';

@Component({
  selector: 'biblio-keyword-picker',
  templateUrl: './keyword-picker.component.html',
  styleUrls: ['./keyword-picker.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatAutocomplete,
    MatOption,
    MatFormField,
    MatInput,
    MatAutocompleteTrigger,
    MatIconButton,
    MatSuffix,
    MatTooltip,
    MatIcon,
    AsyncPipe,
  ],
})
export class KeywordPickerComponent implements OnInit {
  /**
   * The maximum count of works to retrieve. Default=10.
   */
  public readonly limit = input<number>(10);

  /**
   * The label attached to this picker.
   */
  public readonly label = input<string>('keyword/lang:keyword');

  /**
   * Fired when a keyword is selected.
   */
  public readonly keywordChange = output<Keyword>();

  public form: FormGroup;
  public lookup: FormControl;
  public keywords$: Observable<Keyword[]> | undefined;
  public keyword: Keyword | undefined;

  constructor(formBuilder: FormBuilder, private _biblioService: BiblioService) {
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
      pageSize: this.limit(),
      language: language,
      value: value,
    };
  }

  public ngOnInit(): void {
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
    return keyword ? `[${keyword.language}] ${keyword.value}` : '';
  }

  public pickKeyword(keyword: Keyword): void {
    this.keywordChange.emit(keyword);
    this.clear();
  }
}
