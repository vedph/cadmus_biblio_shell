import { Component, effect, input, model, OnInit, output } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
  MatExpansionPanelDescription,
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import {
  MatAutocomplete,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatOption } from '@angular/material/core';
import {
  MatFormField,
  MatLabel,
  MatHint,
  MatSuffix,
  MatError,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSelect } from '@angular/material/select';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { BiblioService, KeywordFilter } from '@myrmidon/cadmus-biblio-api';
import { Keyword } from '@myrmidon/cadmus-biblio-core';

@Component({
  selector: 'biblio-work-keywords',
  templateUrl: './work-keywords.component.html',
  styleUrls: ['./work-keywords.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatIcon,
    MatExpansionPanelDescription,
    MatAutocomplete,
    MatOption,
    MatFormField,
    MatLabel,
    MatInput,
    MatAutocompleteTrigger,
    MatHint,
    MatIconButton,
    MatSuffix,
    MatTooltip,
    MatSelect,
    MatError,
    AsyncPipe,
  ],
})
export class WorkKeywordsComponent implements OnInit {
  public readonly keywords = model<Keyword[]>();

  /**
   * The maximum count of authors to retrieve. Default=10.
   */
  public readonly limit = input<number>(10);

  /**
   * Keyword's languages thesaurus entries.
   */
  public readonly langEntries = input<ThesaurusEntry[]>();

  /**
   * Event fired when this editor is discarded.
   */
  public readonly editorClose = output();

  public lookup: UntypedFormControl;
  public search: FormGroup;
  public keywordsArr: FormArray;
  public form: FormGroup;
  public groups: FormGroup[];

  public current: string | undefined;
  public editing: boolean;

  public keywords$: Observable<Keyword[]> | undefined;
  public keyword: Keyword | undefined;

  constructor(
    private _formBuilder: FormBuilder,
    private _biblioService: BiblioService
  ) {
    this.editing = false;
    // form
    this.lookup = _formBuilder.control(null);
    this.search = _formBuilder.group({
      lookup: this.lookup,
    });
    this.keywordsArr = _formBuilder.array([]);
    this.groups = this.keywordsArr.controls as FormGroup[];
    this.form = _formBuilder.group({
      search: this.search,
      keywords: this.keywordsArr,
    });

    effect(() => {
      this.updateForm(this.keywords());
    });
  }

  private getFilter(filterText: string): KeywordFilter {
    const m = filterText.match('^(?:([a-z]{3}):)?(.+)');
    return {
      pageNumber: 1,
      pageSize: this.limit(),
      language: m ? m[1] : undefined,
      value: m ? m[2] : undefined,
    };
  }

  public ngOnInit(): void {
    // autocomplete
    this.keywords$ = this.lookup.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value: Keyword | string) => {
        // the string comes from user typing
        if (typeof value === 'string') {
          // lookup and return results
          const filter = this.getFilter(value);
          return this._biblioService.getKeywords(filter).pipe(
            switchMap((p) => {
              return of(p.items);
            })
          );
        } else {
          // the authors come from results
          return of([value]);
        }
      })
    );

    // update current when authors change
    this.keywordsArr.valueChanges.pipe(debounceTime(300)).subscribe((_) => {
      this.current = this.buildCurrent();
    });

    this.current = this.buildCurrent();
  }

  private updateForm(model: Keyword[] | undefined): void {
    if (!model) {
      this.form.reset();
      return;
    }

    this.keywordsArr.clear();
    if (model) {
      const sorted = [...model];
      sorted.sort((a: Keyword, b: Keyword) => {
        if (a.language !== b.language) {
          const la = a.language || '';
          const lb = b.language || '';
          return la.localeCompare(lb);
        }
        if (a.value !== b.value) {
          const va = a.value || '';
          const vb = b.value || '';
          return va.localeCompare(vb);
        }
        return 0;
      });
      for (let a of sorted) {
        this.keywordsArr.controls.push(this.getKeywordGroup(a));
      }
    }

    this.form.markAsPristine();
  }

  //#region Autocomplete
  public keywordToString(keyword: Keyword): string {
    if (!keyword) {
      return '';
    }
    return `[${keyword.language}] ${keyword.value}`;
  }

  public clearKeyword(): void {
    this.keyword = undefined;
    this.lookup.setValue(null);
  }

  public pickKeyword(keyword: Keyword): void {
    this.keyword = keyword;
    this.addKeyword(keyword);
  }
  //#endregion

  //#region Keywords
  private getKeywordGroup(keyword?: Keyword): FormGroup {
    return this._formBuilder.group({
      language: this._formBuilder.control(keyword?.language, [
        Validators.required,
        Validators.pattern('^[a-z]{3}$'),
      ]),
      value: this._formBuilder.control(keyword?.value, [
        Validators.required,
        Validators.maxLength(50),
      ]),
    });
  }

  public addKeyword(keyword?: Keyword): void {
    // TODO sorted
    this.keywordsArr.push(this.getKeywordGroup(keyword));
    this.keywordsArr.markAsDirty();
  }

  public removeKeyword(index: number): void {
    this.keywordsArr.removeAt(index);
    this.keywordsArr.markAsDirty();
  }

  private getKeywords(): Keyword[] | undefined {
    const entries: Keyword[] = [];
    for (let i = 0; i < this.keywordsArr.length; i++) {
      const g = this.keywordsArr.at(i) as FormGroup;
      entries.push({
        language: g.controls['language'].value?.trim(),
        value: g.controls['value'].value?.trim(),
      });
    }
    return entries.length ? entries : undefined;
  }

  private buildCurrent(): string {
    const sb: string[] = [];
    for (let i = 0; i < this.keywordsArr.length; i++) {
      const g = this.keywordsArr.at(i) as FormGroup;
      if (i > 0) {
        sb.push('; ');
      }
      sb.push('[');
      sb.push(g.controls['language'].value?.trim());
      sb.push('] ');
      sb.push(g.controls['value'].value?.trim());
    }
    return sb.join('');
  }
  //#endregion

  public cancel(): void {
    this.editing = false;
    this.updateForm(this.keywords());
    this.editorClose.emit();
  }

  public save(): void {
    if (this.form.invalid) {
      return;
    }
    this.editing = false;
    this.keywords.set(this.getKeywords());
  }
}
