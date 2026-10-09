import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
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
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormField,
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
export class KeywordPickerComponent {
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

  /**
   * The lookup text box: a filter string while the user is typing,
   * or the keyword picked from the autocomplete.
   */
  private readonly _lookup = signal<{ lookup: Keyword | string | null }>({
    lookup: null,
  });
  public readonly form = form(this._lookup);

  public readonly keywords$: Observable<Keyword[]>;
  public keyword: Keyword | undefined;

  constructor(private _biblioService: BiblioService) {
    this.keywords$ = toObservable(this.form.lookup().value).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value: Keyword | string | null) => {
        // cleared lookup
        if (value === null || value === undefined) {
          return of([]);
        }
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

  public clear(): void {
    this.keyword = undefined;
    this.form.lookup().value.set(null);
  }

  public keywordToString(keyword: Keyword): string {
    return keyword ? `[${keyword.language}] ${keyword.value}` : '';
  }

  public pickKeyword(keyword: Keyword): void {
    this.keywordChange.emit(keyword);
    this.clear();
  }
}
