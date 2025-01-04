import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
  MatExpansionPanelDescription,
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { RefLookupComponent } from '@myrmidon/cadmus-refs-lookup';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { Author, WorkAuthor } from '@myrmidon/cadmus-biblio-core';

import { AuthorRefLookupService } from '../../services/author-ref-lookup.service';

/**
 * Work's authors editor. This lets users pick any author by
 * typing some letters of his last name, adding it to the set
 * of authors assigned to a work.
 */
@Component({
  selector: 'biblio-work-authors',
  templateUrl: './work-authors.component.html',
  styleUrls: ['./work-authors.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatIcon,
    MatExpansionPanelDescription,
    RefLookupComponent,
    MatButton,
    MatTooltip,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatSelect,
    MatOption,
  ],
})
export class WorkAuthorsComponent implements OnInit {
  private _updating?: boolean;
  private _authors: WorkAuthor[] | undefined;

  @Input()
  public get authors(): WorkAuthor[] | undefined {
    return this._authors;
  }
  public set authors(value: WorkAuthor[] | undefined) {
    if (this._authors === value) {
      return;
    }
    this._authors = value;
    this.updateForm(value);
  }

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
  public authorsChange: EventEmitter<WorkAuthor[]>;
  /**
   * Event fired when this editor is discarded.
   */
  @Output()
  public editorClose: EventEmitter<any>;

  public editedAuthors: FormArray;
  public authorCount: FormControl<number>;
  public form: FormGroup;
  public groups: FormGroup[];

  public currentAuthors: string | undefined;
  public editing: boolean;

  public authors$: Observable<Author[]> | undefined;
  public author: WorkAuthor | undefined;

  constructor(
    public authorLookupService: AuthorRefLookupService,
    private _formBuilder: FormBuilder
  ) {
    this.authorsChange = new EventEmitter<WorkAuthor[]>();
    this.editorClose = new EventEmitter<any>();
    this.editing = false;
    this.authorCount = _formBuilder.control(0, {
      validators: Validators.min(1),
      nonNullable: true,
    });
    this.editedAuthors = _formBuilder.array([]);
    this.groups = this.editedAuthors.controls as FormGroup[];
    this.form = _formBuilder.group({
      editedAuthors: this.editedAuthors,
      authorCount: this.authorCount,
    });
  }

  ngOnInit(): void {
    // update current when authors change
    this.editedAuthors.valueChanges.pipe(debounceTime(300)).subscribe((_) => {
      if (!this._updating) {
        this.currentAuthors = this.buildCurrentAuthors();
        this.authorCount.setValue(this.editedAuthors.length);
        this.authorCount.updateValueAndValidity();
        this.authorCount.markAsDirty();
      }
    });
  }

  private updateForm(authors: WorkAuthor[] | undefined): void {
    if (!authors?.length) {
      this.form.reset();
      this.currentAuthors = undefined;
      return;
    }

    this._updating = true;
    this.editedAuthors.clear();
    if (authors) {
      // when setting authors, we must ensure they are
      // sorted according to their ordinals if any;
      // otherwise, just stick with the received order.
      const sorted = [...authors];
      sorted.sort((a: WorkAuthor, b: WorkAuthor) => {
        return (a.ordinal || 0) - (b.ordinal || 0);
      });
      for (let a of sorted) {
        this.editedAuthors.controls.push(this.getAuthorGroup(a));
      }
    }
    this.currentAuthors = this.buildCurrentAuthors();
    this.authorCount.setValue(this.editedAuthors.length);
    this.form.markAsPristine();
    this._updating = false;
  }

  //#region Authors
  public pickAuthor(author: unknown): void {
    this.author = author as Author;
    const wa: WorkAuthor = {
      ...this.author,
      ordinal: this.editedAuthors.length + 1,
    };
    this.addAuthor(wa);
    setTimeout(() => {
      this.author = undefined;
    });
  }

  private getAuthorGroup(author?: WorkAuthor): FormGroup {
    return this._formBuilder.group({
      id: this._formBuilder.control<string | null>(author?.id || null),
      last: this._formBuilder.control<string | null>(author?.last || null, [
        Validators.required,
        Validators.maxLength(50),
      ]),
      first: this._formBuilder.control<string | null>(author?.first || null, [
        Validators.required,
        Validators.maxLength(50),
      ]),
      suffix: this._formBuilder.control<string | null>(author?.suffix || null, {
        validators: Validators.maxLength(50),
        updateOn: 'change',
      }),
      role: this._formBuilder.control<string | null>(author?.role || null, {
        validators: Validators.maxLength(50),
        updateOn: 'change',
      }),
    });
  }

  public addAuthor(item?: WorkAuthor): void {
    // do not an already existing author
    if (item) {
      for (let i = 0; i < this.editedAuthors.length; i++) {
        const g = this.editedAuthors.at(i) as FormGroup;
        if (g.controls['id'].value === item.id) {
          return;
        }
      }
    }
    this.editedAuthors.push(this.getAuthorGroup(item));
    this.editedAuthors.markAsDirty();
  }

  public removeAuthor(index: number): void {
    this.editedAuthors.removeAt(index);
    this.editedAuthors.markAsDirty();
  }

  public moveAuthorUp(index: number): void {
    if (index < 1) {
      return;
    }
    const author = this.editedAuthors.controls[index];
    this.editedAuthors.removeAt(index);
    this.editedAuthors.insert(index - 1, author);
    this.editedAuthors.markAsDirty();
  }

  public moveAuthorDown(index: number): void {
    if (index + 1 >= this.editedAuthors.length) {
      return;
    }
    const author = this.editedAuthors.controls[index];
    this.editedAuthors.removeAt(index);
    this.editedAuthors.insert(index + 1, author);
    this.editedAuthors.markAsDirty();
  }

  private getAuthors(): WorkAuthor[] | undefined {
    const entries: WorkAuthor[] = [];
    for (let i = 0; i < this.editedAuthors.length; i++) {
      const g = this.editedAuthors.at(i) as FormGroup;
      entries.push({
        id: g.controls['id'].value,
        last: g.controls['last'].value?.trim(),
        first: g.controls['first'].value?.trim(),
        suffix: g.controls['suffix'].value?.trim(),
        role: g.controls['role'].value?.trim(),
        ordinal: i + 1,
      });
    }
    return entries.length ? entries : undefined;
  }

  private buildCurrentAuthors(): string {
    const sb: string[] = [];
    for (let i = 0; i < this.editedAuthors.length; i++) {
      const g = this.editedAuthors.at(i) as FormGroup;
      if (i > 0) {
        sb.push('; ');
      }
      // last
      sb.push(g.controls['last'].value?.trim());
      // , first
      const first = g.controls['first'].value?.trim();
      if (first) {
        sb.push(', ');
        sb.push(first);
      }
      // (role)
      const role = g.controls['role'].value?.trim();
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
    this.updateForm(this._authors);
    this.editorClose.emit();
  }

  public save(): void {
    if (this.form.invalid) {
      return;
    }
    this._authors = this.getAuthors();
    this.editing = false;
    this.authorsChange.emit(this._authors);
  }
}
