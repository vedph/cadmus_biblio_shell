import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable, of } from 'rxjs';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { BiblioService, KeywordFilter } from '@myrmidon/cadmus-biblio-api';
import { Keyword } from '@myrmidon/cadmus-biblio-core';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'biblio-work-keywords',
  templateUrl: './work-keywords.component.html',
  styleUrls: ['./work-keywords.component.css'],
})
export class WorkKeywordsComponent implements OnInit {
  private _model: Keyword[] | undefined;

  @Input()
  public get model(): Keyword[] | undefined {
    return this._model;
  }
  public set model(value: Keyword[] | undefined) {
    this._model = value;
    this.updateForm(value);
  }

  /**
   * The maximum count of authors to retrieve. Default=10.
   */
  @Input()
  public limit: number;

  /**
   * Keyword's languages thesaurus entries.
   */
  @Input()
  public langEntries: ThesaurusEntry[] | undefined;

  /**
   * Event fired when author(s) are set.
   */
  @Output()
  public modelChange: EventEmitter<Keyword[]>;
  /**
   * Event fired when this editor is discarded.
   */
  @Output()
  public editorClose: EventEmitter<any>;

  public lookup: FormControl;
  public search: FormGroup;
  public keywords: FormArray;
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
    this.modelChange = new EventEmitter<Keyword[]>();
    this.editorClose = new EventEmitter<any>();
    this.editing = false;
    this.limit = 10;
    // form
    this.lookup = _formBuilder.control(null);
    this.search = _formBuilder.group({
      lookup: this.lookup,
    });
    this.keywords = _formBuilder.array([]);
    this.groups = this.keywords.controls as FormGroup[];
    this.form = _formBuilder.group({
      search: this.search,
      keywords: this.keywords,
    });
  }

  private getFilter(filterText: string): KeywordFilter {
    const m = filterText.match('^(?:([a-z]{3}):)?(.+)');
    return {
      pageNumber: 1,
      pageSize: this.limit,
      language: m ? m[1] : undefined,
      value: m ? m[2] : undefined,
    };
  }

  ngOnInit(): void {
    this.updateForm(this.model);

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
    this.keywords.valueChanges.pipe(debounceTime(300)).subscribe((_) => {
      this.current = this.buildCurrent();
    });
  }

  private updateForm(model: Keyword[] | undefined): void {
    if (!model) {
      this.form.reset();
      return;
    }

    this.keywords.clear();
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
        this.keywords.controls.push(this.getKeywordGroup(a));
      }
    }

    this.form.markAsPristine();
  }

  private getModel(): Keyword[] | undefined {
    return this.getKeywords();
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
    this.keywords.push(this.getKeywordGroup(keyword));
    this.keywords.markAsDirty();
  }

  public removeKeyword(index: number): void {
    this.keywords.removeAt(index);
    this.keywords.markAsDirty();
  }

  private getKeywords(): Keyword[] | undefined {
    const entries: Keyword[] = [];
    for (let i = 0; i < this.keywords.length; i++) {
      const g = this.keywords.at(i) as FormGroup;
      entries.push({
        language: g.controls.language.value?.trim(),
        value: g.controls.value.value?.trim(),
      });
    }
    return entries.length ? entries : undefined;
  }

  private buildCurrent(): string {
    const sb: string[] = [];
    for (let i = 0; i < this.keywords.length; i++) {
      const g = this.keywords.at(i) as FormGroup;
      if (i > 0) {
        sb.push('; ');
      }
      sb.push('[');
      sb.push(g.controls.language.value?.trim());
      sb.push('] ');
      sb.push(g.controls.value.value?.trim());
    }
    return sb.join('');
  }
  //#endregion

  public cancel(): void {
    this.editing = false;
    this.updateForm(this._model);
    this.editorClose.emit();
  }

  public save(): void {
    if (this.form.invalid) {
      return;
    }
    const model = this.getModel();
    if (!model) {
      return;
    }
    this.editing = false;
    this.modelChange.emit(model);
  }
}
