import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  Container,
  EditedWork,
  Keyword,
  WorkAuthor,
  WorkType,
  WorkKeyService,
  BiblioUtilService,
} from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { Observable, of } from 'rxjs';
import { distinctUntilChanged, switchMap, take } from 'rxjs/operators';

/**
 * Work or container editor.
 */
@Component({
  selector: 'biblio-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.css'],
})
export class WorkComponent implements OnInit {
  private _model: EditedWork | undefined;

  @Input()
  public get model(): EditedWork | undefined {
    return this._model;
  }
  public set model(value: EditedWork | undefined) {
    this._model = value;
    this.updateForm(value);
  }

  /**
   * Authors roles entries.
   */
  @Input()
  public roleEntries: ThesaurusEntry[] | undefined;
  /**
   * Keywords language entries.
   */
  @Input()
  public langEntries: ThesaurusEntry[] | undefined;

  @Output()
  public modelChange: EventEmitter<EditedWork>;
  @Output()
  public editorClose: EventEmitter<any>;

  public form: FormGroup;
  public isContainer: FormControl<boolean>;
  public type: FormControl<string | null>;
  public key: FormControl<string | null>;
  public authors: FormControl<WorkAuthor[]>;
  public title: FormControl<string | null>;
  public language: FormControl<string | null>;
  public placePub: FormControl<string | null>;
  public yearPub: FormControl<number>;
  public publisher: FormControl<string | null>;
  public container: FormControl<Container | null>;
  public firstPage: FormControl<number>;
  public lastPage: FormControl<number>;
  public number: FormControl<string | null>;
  public note: FormControl<string | null>;
  public location: FormControl<string | null>;
  public hasAccessDate: FormControl<boolean>;
  public accessDate: FormControl<Date | null>;
  public keywords: FormControl<Keyword[]>;

  public types$: Observable<WorkType[]> | undefined;

  constructor(
    formBuilder: FormBuilder,
    private _biblioService: BiblioService,
    private _workKeyService: WorkKeyService,
    private _biblioUtil: BiblioUtilService
  ) {
    this.modelChange = new EventEmitter<EditedWork>();
    this.editorClose = new EventEmitter<any>();

    // form
    this.isContainer = formBuilder.control(false, { nonNullable: true });
    this.type = formBuilder.control(null, Validators.required);
    this.key = formBuilder.control(null, Validators.maxLength(300));
    this.authors = formBuilder.control([], { nonNullable: true });
    this.title = formBuilder.control(null, [
      Validators.required,
      Validators.maxLength(200),
    ]);
    this.language = formBuilder.control(null, [
      Validators.required,
      Validators.pattern('^[a-z]{3}$'),
    ]);
    this.placePub = formBuilder.control(null, Validators.maxLength(100));
    this.yearPub = formBuilder.control(0, { nonNullable: true });
    this.publisher = formBuilder.control(null, Validators.maxLength(50));
    this.container = formBuilder.control(null);
    this.firstPage = formBuilder.control(0, { nonNullable: true });
    this.lastPage = formBuilder.control(0, { nonNullable: true });
    this.number = formBuilder.control(null, Validators.maxLength(50));
    this.note = formBuilder.control(null, Validators.maxLength(500));
    this.location = formBuilder.control(null, Validators.maxLength(500));
    this.hasAccessDate = formBuilder.control(false, { nonNullable: true });
    this.accessDate = formBuilder.control(null);
    this.keywords = formBuilder.control([], { nonNullable: true });
    this.form = formBuilder.group({
      isContainer: this.isContainer,
      type: this.type,
      key: this.key,
      authors: this.authors,
      title: this.title,
      language: this.language,
      placePub: this.placePub,
      yearPub: this.yearPub,
      publisher: this.publisher,
      container: this.container,
      firstPage: this.firstPage,
      lastPage: this.lastPage,
      number: this.number,
      note: this.note,
      location: this.location,
      hasAccessDate: this.hasAccessDate,
      accessDate: this.accessDate,
      keywords: this.keywords,
    });
  }

  ngOnInit(): void {
    this.accessDate.disable();
    this.updateForm(this.model);

    // types are loaded once from backend
    this.types$ = this._biblioService
      .getWorkTypes({
        pageNumber: 1,
        pageSize: 0, // = all at once
      })
      .pipe(
        switchMap((page) => {
          return of(page.items);
        }),
        take(1)
      );

    // automatically set last page when first is set to something > 0
    // and last is not set
    this.firstPage.valueChanges.pipe(distinctUntilChanged()).subscribe((_) => {
      if (
        this.firstPage.value > 0 &&
        this.lastPage.value < this.firstPage.value
      ) {
        this.lastPage.setValue(this.firstPage.value);
        this.lastPage.updateValueAndValidity();
        this.lastPage.markAsDirty();
      }
    });

    // disable access date when has none
    this.hasAccessDate.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value) {
          this.accessDate.enable();
        } else {
          this.accessDate.disable();
        }
      });
  }

  private updateForm(model: EditedWork | undefined): void {
    if (!model) {
      this.form.reset();
      return;
    }

    this.isContainer.setValue(model.isContainer || false);
    this.type.setValue(model.type);
    this.key.setValue(model.key);
    this.authors.setValue(model.authors || []);
    this.title.setValue(model.title);
    this.language.setValue(model.language);
    this.placePub.setValue(model.placePub || null);
    this.yearPub.setValue(model.yearPub || 0);
    this.publisher.setValue(model.publisher || null);
    this.container.setValue(model.container || null);
    this.firstPage.setValue(model.firstPage || 0);
    this.lastPage.setValue(model.lastPage || 0);
    this.number.setValue(model.number || null);
    this.note.setValue(model.note || null);
    this.location.setValue(model.location || null);
    this.hasAccessDate.setValue(model.accessDate ? true : false);
    this.accessDate.setValue(model.accessDate || null);
    this.keywords.setValue(model.keywords || []);

    // if it has a container it can't be a container
    if (model.container) {
      this.isContainer.setValue(false);
    }

    this.form.markAsPristine();
  }

  private getModel(): EditedWork {
    return {
      isContainer: this.isContainer.value,
      id: this._model?.id,
      type: this.type.value || '',
      key: this.key.value?.trim() || '',
      authors: this.authors.value?.length ? this.authors.value : undefined,
      title: this.title.value?.trim() || '',
      language: this.language.value || '',
      placePub: this.placePub.value?.trim(),
      yearPub: this.yearPub.value,
      publisher: this.publisher.value?.trim(),
      container: this.container.value || undefined,
      firstPage: this.firstPage.value,
      lastPage: this.lastPage.value,
      number: this.number.value?.trim(),
      note: this.note.value?.trim(),
      location: this.location.value?.trim(),
      accessDate: this.hasAccessDate.value ? this.accessDate.value! : undefined,
      keywords: this.keywords.value?.length ? this.keywords.value : undefined,
    };
  }

  public onAuthorsChange(authors: WorkAuthor[]): void {
    this.authors.setValue(authors || []);
    this.authors.updateValueAndValidity();
    this.authors.markAsDirty();
  }

  public onKeywordsChange(keywords: Keyword[]): void {
    this.keywords.setValue(keywords || []);
    this.keywords.updateValueAndValidity();
    this.keywords.markAsDirty();
  }

  public onContainerChange(container: Container | undefined): void {
    this.container.setValue(container || null);
    this.container.updateValueAndValidity();
    this.container.markAsDirty();
  }

  public removeContainer() : void {
    this.container.reset();
  }

  public workToString(work?: Container | null): string {
    return this._biblioUtil.workToString(work);
  }

  public buildKey(): void {
    this.key.setValue(this._workKeyService.buildKey(this.getModel()));
    this.key.updateValueAndValidity();
    this.key.markAsDirty();
  }

  public cancel(): void {
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
    this.modelChange.emit(model);
  }
}
