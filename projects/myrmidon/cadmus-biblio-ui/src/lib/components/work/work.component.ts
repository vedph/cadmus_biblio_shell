import { Component, effect, input, model, OnInit, output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { Observable, of } from 'rxjs';
import { distinctUntilChanged, switchMap, take } from 'rxjs/operators';

import { MatCheckbox } from '@angular/material/checkbox';
import {
  MatFormField,
  MatLabel,
  MatError,
  MatSuffix,
} from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import {
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDatepicker,
} from '@angular/material/datepicker';

import { RefLookupComponent } from '@myrmidon/cadmus-refs-lookup';
import {
  HistoricalDate,
  HistoricalDateModel,
  HistoricalDateComponent,
} from '@myrmidon/cadmus-refs-historical-date';

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
import { BiblioService } from '@myrmidon/cadmus-biblio-api';

import { WorkAuthorsComponent } from '../work-authors/work-authors.component';
import { WorkKeywordsComponent } from '../work-keywords/work-keywords.component';
import { ExternalIdsComponent } from '../external-ids/external-ids.component';
import { WorkRefLookupService } from '../../services/work-ref-lookup.service';

/**
 * Work or container editor.
 */
@Component({
  selector: 'biblio-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatError,
    MatInput,
    MatIconButton,
    MatSuffix,
    MatIcon,
    WorkAuthorsComponent,
    HistoricalDateComponent,
    RefLookupComponent,
    MatTooltip,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepicker,
    WorkKeywordsComponent,
    ExternalIdsComponent,
    AsyncPipe,
  ],
})
export class WorkComponent implements OnInit {
  public readonly work = model<EditedWork>();

  /**
   * Authors roles entries: ext-biblio-author-roles.
   */
  public readonly roleEntries = input<ThesaurusEntry[]>();
  /**
   * Keywords language entries: ext-biblio-languages.
   */
  public readonly langEntries = input<ThesaurusEntry[]>();
  /**
   * Scope entries: ext-biblio-link-scopes.
   */
  public readonly scopeEntries = input<ThesaurusEntry[]>();

  public readonly editorClose = output();

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
    this.isContainer = formBuilder.control(false, { nonNullable: true });
    this.type = formBuilder.control(null, Validators.required);
    this.isUserKey = formBuilder.control(false, { nonNullable: true });
    this.key = formBuilder.control(null, Validators.maxLength(300));
    this.authors = formBuilder.control([], { nonNullable: true });
    this.title = formBuilder.control(null, [
      Validators.required,
      Validators.maxLength(200),
    ]);
    this.language = formBuilder.control(null, [Validators.required]);
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

    effect(() => {
      this.updateForm(this.work());
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
    this.hasDatation.setValue(!!work.datation);

    setTimeout(() => {
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
        // this.hasDatation.setValue(true);
        this.datation.setValue(HistoricalDate.parse(work.datation) || null);
      } else {
        // this.hasDatation.setValue(false);
        this.datation.reset();
      }
      this.location.setValue(work.location || null);
      this.hasAccessDate.setValue(work.accessDate ? true : false);
      this.accessDate.setValue(work.accessDate || null);
      this.keywords.setValue(work.keywords || []);
      this.links.setValue(work.links || []);

      // if it has a container it can't be a container
      // if (work.container) {
      //   this.isContainer.setValue(false);
      // }

      this.form.markAsPristine();
    }, 0);
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
      id: this.work()?.id,
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

  public onContainerChange(container: unknown): void {
    this.container.setValue((container as Container) || null);
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
    this.work.set(this.getWork());
  }
}
