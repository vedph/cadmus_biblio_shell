import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { distinctUntilChanged, switchMap, take } from 'rxjs/operators';

import {
  Container,
  EditedWork,
  Keyword,
  WorkAuthor,
  WorkType,
  WorkKeyService,
  BiblioUtilService,
  ExternalId,
} from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import {
  HistoricalDate,
  HistoricalDateModel,
} from '@myrmidon/cadmus-refs-historical-date';
import { BiblioService } from '@myrmidon/cadmus-biblio-api';

import { WorkRefLookupService } from '../../services/work-ref-lookup.service';

/**
 * Work or container editor.
 */
@Component({
  selector: 'biblio-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.css'],
})
export class WorkComponent implements OnInit {
  private _work: EditedWork | undefined;

  @Input()
  public get work(): EditedWork | undefined {
    return this._work;
  }
  public set work(value: EditedWork | undefined) {
    if (this._work === value) {
      return;
    }
    this._work = value;
    this.updateForm(value);
  }

  /**
   * Authors roles entries: ext-biblio-author-roles.
   */
  @Input()
  public roleEntries: ThesaurusEntry[] | undefined;
  /**
   * Keywords language entries: ext-biblio-languages.
   */
  @Input()
  public langEntries: ThesaurusEntry[] | undefined;
  // ext-biblio-link-scopes
  @Input()
  public scopeEntries: ThesaurusEntry[] | undefined;

  @Output()
  public workChange: EventEmitter<EditedWork>;
  @Output()
  public editorClose: EventEmitter<any>;

  public form: FormGroup;
  public isContainer: FormControl<boolean>;
  public type: FormControl<string | null>;
  public isUserKey: FormControl<boolean>;
  public key: FormControl<string | null>;
  public authors: FormControl<WorkAuthor[]>;
  public title: FormControl<string | null>;
  public language: FormControl<string | null>;
  public placePub: FormControl<string | null>;
  public yearPub: FormControl<number>;
  public yearPub2: FormControl<number>;
  public publisher: FormControl<string | null>;
  public container: FormControl<Container | null>;
  public firstPage: FormControl<number>;
  public lastPage: FormControl<number>;
  public number: FormControl<string | null>;
  public note: FormControl<string | null>;
  public hasDatation: FormControl<boolean>;
  public datation: FormControl<HistoricalDateModel | null>;
  public location: FormControl<string | null>;
  public hasAccessDate: FormControl<boolean>;
  public accessDate: FormControl<Date | null>;
  public keywords: FormControl<Keyword[]>;
  public links: FormControl<ExternalId[]>;

  public types$: Observable<WorkType[]> | undefined;

  constructor(
    formBuilder: FormBuilder,
    public lookupService: WorkRefLookupService,
    private _biblioService: BiblioService,
    private _workKeyService: WorkKeyService,
    private _biblioUtil: BiblioUtilService
  ) {
    this.workChange = new EventEmitter<EditedWork>();
    this.editorClose = new EventEmitter<any>();

    // form
    this.isContainer = formBuilder.control(false, { nonNullable: true });
    this.type = formBuilder.control(null, Validators.required);
    this.isUserKey = formBuilder.control(false, { nonNullable: true });
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
    this.yearPub2 = formBuilder.control(0, { nonNullable: true });
    this.publisher = formBuilder.control(null, Validators.maxLength(50));
    this.container = formBuilder.control(null);
    this.firstPage = formBuilder.control(0, { nonNullable: true });
    this.lastPage = formBuilder.control(0, { nonNullable: true });
    this.number = formBuilder.control(null, Validators.maxLength(50));
    this.note = formBuilder.control(null, Validators.maxLength(500));
    this.hasDatation = formBuilder.control(false, { nonNullable: true });
    this.datation = formBuilder.control(null);
    this.location = formBuilder.control(null, Validators.maxLength(500));
    this.hasAccessDate = formBuilder.control(false, { nonNullable: true });
    this.accessDate = formBuilder.control(null);
    this.keywords = formBuilder.control([], { nonNullable: true });
    this.links = formBuilder.control([], { nonNullable: true });
    this.form = formBuilder.group({
      isContainer: this.isContainer,
      type: this.type,
      isUserKey: this.isUserKey,
      key: this.key,
      authors: this.authors,
      title: this.title,
      language: this.language,
      placePub: this.placePub,
      yearPub: this.yearPub,
      yearPub2: this.yearPub2,
      publisher: this.publisher,
      container: this.container,
      firstPage: this.firstPage,
      lastPage: this.lastPage,
      number: this.number,
      note: this.note,
      hasDatation: this.hasDatation,
      datation: this.datation,
      location: this.location,
      hasAccessDate: this.hasAccessDate,
      accessDate: this.accessDate,
      keywords: this.keywords,
      links: this.links,
    });
  }

  ngOnInit(): void {
    this.accessDate.disable();

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

  private updateForm(work: EditedWork | undefined): void {
    if (!work) {
      this.form.reset();
      return;
    }

    this.isContainer.setValue(work.isContainer || false);
    this.type.setValue(work.type);

    // a user key starts with !, but here we show 2 controls,
    // a checkbox for user and a textbox for value (without !)
    const userKey = work.key.startsWith('!');
    this.isUserKey.setValue(userKey);
    this.key.setValue(userKey ? work.key.substring(1) : work.key);

    this.authors.setValue(work.authors || []);
    this.title.setValue(work.title);
    this.language.setValue(work.language);
    this.placePub.setValue(work.placePub || null);
    this.yearPub.setValue(work.yearPub || 0);
    this.yearPub2.setValue(work.yearPub2 || 0);
    this.publisher.setValue(work.publisher || null);
    this.container.setValue(work.container || null);
    this.firstPage.setValue(work.firstPage || 0);
    this.lastPage.setValue(work.lastPage || 0);
    this.number.setValue(work.number || null);
    this.note.setValue(work.note || null);
    if (work.datation) {
      this.hasDatation.setValue(true);
      this.datation.setValue(HistoricalDate.parse(work.datation) || null);
    } else {
      this.hasDatation.setValue(false);
      this.datation.reset();
    }
    this.location.setValue(work.location || null);
    this.hasAccessDate.setValue(work.accessDate ? true : false);
    this.accessDate.setValue(work.accessDate || null);
    this.keywords.setValue(work.keywords || []);
    this.links.setValue(work.links || []);

    // if it has a container it can't be a container
    if (work.container) {
      this.isContainer.setValue(false);
    }

    this.form.markAsPristine();
  }

  private getWork(): EditedWork {
    const key = this.key.value?.trim() || '';

    let datation: string | null = null;
    let datationValue: number | null = 0;
    if (this.hasDatation.value && this.datation.value) {
      const hd = new HistoricalDate(this.datation.value);
      datation = hd.toString();
      datationValue = hd.getSortValue();
    }

    return {
      isContainer: this.isContainer.value,
      id: this._work?.id,
      type: this.type.value || '',
      key: this.isUserKey.value ? '!' + key : key,
      authors: this.authors.value?.length ? this.authors.value : undefined,
      title: this.title.value?.trim() || '',
      language: this.language.value || '',
      placePub: this.placePub.value?.trim(),
      yearPub: this.yearPub.value,
      yearPub2: this.yearPub2.value || undefined,
      publisher: this.publisher.value?.trim(),
      container: this.container.value || undefined,
      firstPage: this.firstPage.value,
      lastPage: this.lastPage.value,
      number: this.number.value?.trim(),
      note: this.note.value?.trim(),
      datation: datation || undefined,
      datationValue: datationValue || undefined,
      location: this.location.value?.trim(),
      accessDate: this.hasAccessDate.value ? this.accessDate.value! : undefined,
      keywords: this.keywords.value?.length ? this.keywords.value : undefined,
      links: this.links.value?.length ? this.links.value : undefined,
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

  public onDatationChange(datation: HistoricalDateModel | undefined): void {
    this.datation.setValue(datation || null);
    this.datation.updateValueAndValidity();
    this.datation.markAsDirty();
  }

  public onLinksChange(links: ExternalId[]): void {
    this.links.setValue(links || []);
    this.links.updateValueAndValidity();
    this.links.markAsDirty();
  }

  public removeContainer(): void {
    this.container.reset();
  }

  public workToString(work?: Container | null): string {
    return this._biblioUtil.workToString(work);
  }

  public buildKey(): void {
    this.key.setValue(
      this._workKeyService.buildKey(this.getWork(), this.isContainer.value)
    );
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
    this._work = this.getWork();
    this.workChange.emit(this._work);
  }
}
