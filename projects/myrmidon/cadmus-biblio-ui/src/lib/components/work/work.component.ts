import {
  Component,
  computed,
  effect,
  input,
  linkedSignal,
  model,
  OnInit,
  output,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormField,
  disabled,
  form,
  maxLength,
  min,
  required,
} from '@angular/forms/signals';
import { AsyncPipe } from '@angular/common';
import { Observable, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

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
import {
  copyFormValue,
  isImplicitSubmission,
  setFieldFromChild,
} from '@myrmidon/cadmus-ui';
import { BiblioService } from '@myrmidon/cadmus-biblio-api';

import { WorkAuthorsComponent } from '../work-authors/work-authors.component';
import { WorkKeywordsComponent } from '../work-keywords/work-keywords.component';
import { ExternalIdsComponent } from '../external-ids/external-ids.component';
import { WorkRefLookupService } from '../../services/work-ref-lookup.service';

interface WorkControls {
  isContainer: boolean;
  type: string;
  // a user key starts with !, but here we show 2 controls,
  // a checkbox for user and a textbox for value (without !)
  isUserKey: boolean;
  key: string;
  authors: WorkAuthor[];
  title: string;
  language: string;
  placePub: string;
  yearPub: number | null;
  yearPub2: number | null;
  publisher: string;
  container: Container | null;
  firstPage: number | null;
  lastPage: number | null;
  number: string;
  note: string;
  hasDatation: boolean;
  datation: HistoricalDateModel | null;
  location: string;
  hasAccessDate: boolean;
  accessDate: Date | null;
  keywords: Keyword[];
  links: ExternalId[];
}

/**
 * Bound work -> draft.
 */
function toDraft(work: EditedWork | undefined): WorkControls {
  const userKey = work?.key?.startsWith('!') || false;
  return {
    isContainer: work?.isContainer || false,
    type: work?.type || '',
    isUserKey: userKey,
    key: (userKey ? work!.key.substring(1) : work?.key) || '',
    authors: copyFormValue(work?.authors || []),
    title: work?.title || '',
    language: work?.language || '',
    placePub: work?.placePub || '',
    yearPub: work?.yearPub || 0,
    yearPub2: work?.yearPub2 || 0,
    publisher: work?.publisher || '',
    container: copyFormValue(work?.container) || null,
    firstPage: work?.firstPage || 0,
    lastPage: work?.lastPage || 0,
    number: work?.number || '',
    note: work?.note || '',
    hasDatation: !!work?.datation,
    datation: work?.datation ? HistoricalDate.parse(work.datation) : null,
    location: work?.location || '',
    hasAccessDate: !!work?.accessDate,
    accessDate: work?.accessDate || null,
    keywords: copyFormValue(work?.keywords || []),
    links: copyFormValue(work?.links || []),
  };
}

/**
 * Work or container editor.
 */
@Component({
  selector: 'biblio-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormField,
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

  // rebuilt whenever the work changes, i.e. when it is bound,
  // or when this editor saves it
  private readonly _draft = linkedSignal(() => toDraft(this.work()));

  public readonly form = form(this._draft, (p) => {
    required(p.type);
    maxLength(p.key, 300);
    required(p.title);
    maxLength(p.title, 200);
    required(p.language);
    maxLength(p.placePub, 100);
    min(p.yearPub, 0);
    min(p.yearPub2, 0);
    maxLength(p.publisher, 50);
    min(p.firstPage, 0);
    min(p.lastPage, 0);
    maxLength(p.number, 50);
    maxLength(p.note, 500);
    maxLength(p.location, 500);
    disabled(p.accessDate, ({ valueOf }) => !valueOf(p.hasAccessDate));
  });

  /**
   * True when the edited work can be saved, i.e. it is valid and changed.
   */
  public readonly canSave = computed(
    () => this.form().valid() && this.form().dirty()
  );

  public types$: Observable<WorkType[]> | undefined;

  constructor(
    public lookupService: WorkRefLookupService,
    private _biblioService: BiblioService,
    private _workKeyService: WorkKeyService,
    private _biblioUtil: BiblioUtilService
  ) {
    // once the draft mirrors the bound work again, clear the
    // interaction state
    effect(() => {
      const draft = this._draft();
      untracked(() => {
        if (this.isDraftInSync(draft)) {
          this.form().reset();
        }
      });
    });
  }

  ngOnInit(): void {
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
  }

  private isDraftInSync(draft: WorkControls): boolean {
    return JSON.stringify(draft) === JSON.stringify(toDraft(this.work()));
  }

  private getWork(): EditedWork {
    const draft = this._draft();
    const key = draft.key.trim();
    // a container has no container nor pages (their controls are hidden)
    const isContainer = draft.isContainer;

    let datation: string | null = null;
    let datationValue: number | null = 0;
    if (draft.hasDatation && draft.datation) {
      const hd = new HistoricalDate(draft.datation);
      datation = hd.toString();
      datationValue = hd.getSortValue();
    }

    return {
      isContainer,
      id: this.work()?.id,
      type: draft.type,
      key: draft.isUserKey ? '!' + key : key,
      authors: draft.authors.length ? copyFormValue(draft.authors) : undefined,
      title: draft.title.trim(),
      language: draft.language,
      placePub: draft.placePub.trim() || undefined,
      yearPub: draft.yearPub ?? 0,
      yearPub2: draft.yearPub2 || undefined,
      publisher: draft.publisher.trim() || undefined,
      container: isContainer
        ? undefined
        : copyFormValue(draft.container) || undefined,
      firstPage: isContainer ? undefined : (draft.firstPage ?? 0),
      lastPage: isContainer ? undefined : (draft.lastPage ?? 0),
      number: draft.number.trim() || undefined,
      note: draft.note.trim() || undefined,
      datation: datation || undefined,
      datationValue: datationValue || undefined,
      location: draft.location.trim() || undefined,
      accessDate: draft.hasAccessDate ? draft.accessDate! : undefined,
      keywords: draft.keywords.length
        ? copyFormValue(draft.keywords)
        : undefined,
      links: draft.links.length ? copyFormValue(draft.links) : undefined,
    };
  }

  // child editors: their outputs equal to the field's value (e.g. a
  // normalized copy of the value they received) are not changes
  public onAuthorsChange(authors: WorkAuthor[] | undefined): void {
    setFieldFromChild(this.form.authors, copyFormValue(authors || []));
  }

  public onKeywordsChange(keywords: Keyword[] | undefined): void {
    setFieldFromChild(this.form.keywords, copyFormValue(keywords || []));
  }

  public onContainerChange(container: unknown): void {
    setFieldFromChild(
      this.form.container,
      copyFormValue(container as Container) || null
    );
  }

  public onDatationChange(datation: HistoricalDateModel | undefined): void {
    setFieldFromChild(this.form.datation, copyFormValue(datation) || null);
  }

  public onLinksChange(links: ExternalId[] | undefined): void {
    setFieldFromChild(this.form.links, copyFormValue(links || []));
  }

  /**
   * Automatically set the last page when the user sets the first page
   * to something > 0, and the last page is less than it.
   */
  public onFirstPageInput(event: Event): void {
    const first = (event.target as HTMLInputElement).valueAsNumber;
    const last = this.form.lastPage().value() ?? 0;
    if (first > 0 && last < first) {
      this.form.lastPage().value.set(first);
      this.form.lastPage().markAsDirty();
    }
  }

  public removeContainer(): void {
    this.form.container().value.set(null);
    this.form.container().markAsDirty();
  }

  public workToString(work?: Container | null): string {
    return this._biblioUtil.workToString(work);
  }

  public buildKey(): void {
    this.form
      .key()
      .value.set(
        this._workKeyService.buildKey(this.getWork(), this._draft().isContainer)
      );
    this.form.key().markAsDirty();
  }

  public cancel(): void {
    this.editorClose.emit();
  }

  /**
   * Save on Enter in a text input, as the former form did
   * when its save button was enabled.
   */
  public onEnterKey(event: Event): void {
    if (!isImplicitSubmission(event)) {
      return;
    }
    event.preventDefault();
    if (this.canSave()) {
      this.save();
    }
  }

  public save(): void {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    this.work.set(this.getWork());
  }
}
