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

import { AuthorFilter, BiblioService } from '@myrmidon/cadmus-biblio-api';
import { Author, WorkAuthor } from '@myrmidon/cadmus-biblio-core';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

/**
 * Work's authors editor. This lets users pick any author by
 * typing some letters of his last name, adding it to the set
 * of authors assigned to a work.
 */
@Component({
  selector: 'biblio-work-authors',
  templateUrl: './work-authors.component.html',
  styleUrls: ['./work-authors.component.css'],
})
export class WorkAuthorsComponent implements OnInit {
  private _model: WorkAuthor[] | undefined;

  @Input()
  public get model(): WorkAuthor[] | undefined {
    return this._model;
  }
  public set model(value: WorkAuthor[] | undefined) {
    this._model = value;
    this.updateForm(value);
  }

  /**
   * The maximum count of authors to retrieve. Default=10.
   */
  @Input()
  public limit: number;

  /**
   * Author's roles thesaurus entries. When set, there
   * should be an entry with value='-' for the null role.
   */
  @Input()
  public roleEntries: ThesaurusEntry[] | undefined;

  /**
   * Event fired when author(s) are set.
   */
  @Output()
  public modelChange: EventEmitter<WorkAuthor[]>;
  /**
   * Event fired when this editor is discarded.
   */
  @Output()
  public editorClose: EventEmitter<any>;

  public lookup: FormControl;
  public search: FormGroup;
  public authors: FormArray;
  public form: FormGroup;
  public groups: FormGroup[];

  public current: string | undefined;
  public editing: boolean;

  public authors$: Observable<Author[]> | undefined;
  public author: WorkAuthor | undefined;

  constructor(
    private _formBuilder: FormBuilder,
    private _biblioService: BiblioService
  ) {
    this.modelChange = new EventEmitter<WorkAuthor[]>();
    this.editorClose = new EventEmitter<any>();
    this.editing = false;
    this.limit = 10;
    // form
    this.lookup = _formBuilder.control(null);
    this.search = _formBuilder.group({
      lookup: this.lookup,
    });
    this.authors = _formBuilder.array([], Validators.required);
    this.groups = this.authors.controls as FormGroup[];
    this.form = _formBuilder.group({
      search: this.search,
      authors: this.authors,
    });
  }

  private getFilter(filterText: string): AuthorFilter {
    // match either title or author's last name
    return {
      pageNumber: 1,
      pageSize: this.limit,
      last: filterText,
    };
  }

  ngOnInit(): void {
    this.updateForm(this.model);

    // autocomplete
    this.authors$ = this.lookup.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value: WorkAuthor | string) => {
        // the string comes from user typing
        if (typeof value === 'string') {
          // lookup and return results
          const filter = this.getFilter(value);
          return this._biblioService.getAuthors(filter).pipe(
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
    this.authors.valueChanges.pipe(debounceTime(300)).subscribe((_) => {
      this.current = this.buildCurrent();
    });

    this.current = this.buildCurrent();
  }

  private updateForm(model: WorkAuthor[] | undefined): void {
    if (!model) {
      this.form.reset();
      return;
    }

    this.authors.clear();
    if (model) {
      // when setting authors, we must ensure they are
      // sorted according to their ordinals if any;
      // otherwise, just stick with the received order.
      const sorted = [...model];
      sorted.sort((a: WorkAuthor, b: WorkAuthor) => {
        return (a.ordinal || 0) - (b.ordinal || 0);
      });
      for (let a of sorted) {
        this.authors.controls.push(this.getAuthorGroup(a));
      }
    }

    this.form.markAsPristine();
  }

  private getModel(): WorkAuthor[] | undefined {
    return this.getAuthors();
  }

  //#region Autocomplete
  public authorToString(author: Author): string {
    if (!author) {
      return '';
    }

    const sb: string[] = [];
    sb.push(author.last);
    if (author.first) {
      sb.push(', ');
      sb.push(author.first);
    }
    return sb.join('');
  }

  public clearAuthor(): void {
    this.author = undefined;
    this.lookup.setValue(null);
  }

  public pickAuthor(author: Author): void {
    this.author = author;
    const a: WorkAuthor = {
      ...author,
      ordinal: this.authors.length + 1,
    };
    this.addAuthor(a);
  }
  //#endregion

  //#region Authors
  private getAuthorGroup(author?: WorkAuthor): FormGroup {
    return this._formBuilder.group({
      id: this._formBuilder.control(author?.id),
      last: this._formBuilder.control(author?.last, [
        Validators.required,
        Validators.maxLength(50),
      ]),
      first: this._formBuilder.control(author?.first, [
        Validators.required,
        Validators.maxLength(50),
      ]),
      suffix: this._formBuilder.control(
        author?.suffix,
        Validators.maxLength(50)
      ),
      role: this._formBuilder.control(author?.role, Validators.maxLength(50)),
    });
  }

  public addAuthor(item?: WorkAuthor): void {
    this.authors.push(this.getAuthorGroup(item));
    this.authors.markAsDirty();
  }

  public addAuthorBelow(index: number): void {
    this.authors.insert(index + 1, this.getAuthorGroup());
    this.authors.markAsDirty();
  }

  public removeAuthor(index: number): void {
    this.authors.removeAt(index);
    this.authors.markAsDirty();
  }

  public moveAuthorUp(index: number): void {
    if (index < 1) {
      return;
    }
    const author = this.authors.controls[index];
    this.authors.removeAt(index);
    this.authors.insert(index - 1, author);
    this.authors.markAsDirty();
  }

  public moveAuthorDown(index: number): void {
    if (index + 1 >= this.authors.length) {
      return;
    }
    const author = this.authors.controls[index];
    this.authors.removeAt(index);
    this.authors.insert(index + 1, author);
    this.authors.markAsDirty();
  }

  private getAuthors(): WorkAuthor[] | undefined {
    const entries: WorkAuthor[] = [];
    for (let i = 0; i < this.authors.length; i++) {
      const g = this.authors.at(i) as FormGroup;
      entries.push({
        id: g.controls.id.value,
        last: g.controls.last.value?.trim(),
        first: g.controls.first.value?.trim(),
        suffix: g.controls.suffix.value?.trim(),
        role: g.controls.role.value?.trim(),
        ordinal: i + 1,
      });
    }
    return entries.length ? entries : undefined;
  }

  private buildCurrent(): string {
    const sb: string[] = [];
    for (let i = 0; i < this.authors.length; i++) {
      const g = this.authors.at(i) as FormGroup;
      if (i > 0) {
        sb.push('; ');
      }
      // last
      sb.push(g.controls.last.value?.trim());
      // , first
      const first = g.controls.first.value?.trim();
      if (first) {
        sb.push(', ');
        sb.push(first);
      }
      // (role)
      const role = g.controls.role.value?.trim();
      if (role) {
        sb.push(' (');
        sb.push(role);
        sb.push(')');
      }
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
