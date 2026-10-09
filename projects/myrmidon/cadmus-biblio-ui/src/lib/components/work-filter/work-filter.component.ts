import {
  Component,
  input,
  linkedSignal,
  OnInit,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormField, form, min } from '@angular/forms/signals';
import { take } from 'rxjs/operators';

import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { RefLookupComponent } from '@myrmidon/cadmus-refs-lookup';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

import { LocalStorageService } from '@myrmidon/ngx-tools';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { isImplicitSubmission } from '@myrmidon/cadmus-ui';
import { BiblioService, WorkFilter } from '@myrmidon/cadmus-biblio-api';
import {
  Author,
  BiblioUtilService,
  Container,
  WorkType,
} from '@myrmidon/cadmus-biblio-core';

import { AuthorRefLookupService } from '../../services/author-ref-lookup.service';
import { WorkRefLookupService } from '../../services/work-ref-lookup.service';

const WORK_FILTER_KEY = 'cadmus-biblio-ui.work-filter';

interface WorkFilterControls {
  matchAny: boolean;
  // bound to a select only: null is "any"
  type: string | null;
  // the author and container picked from lookups
  author: Author | null;
  lastName: string;
  language: string;
  title: string;
  container: Container | null;
  yearMin: number | null;
  yearMax: number | null;
  key: string;
  keyword: string;
}

/**
 * Filter -> draft. The filter has only the IDs of its author and
 * container: their objects are kept from the previous draft when
 * their IDs did not change, else they are loaded later.
 */
function toDraft(
  filter: WorkFilter,
  previous?: WorkFilterControls
): WorkFilterControls {
  const author = previous?.author;
  const container = previous?.container;
  return {
    matchAny: filter.matchAny ? true : false,
    type: filter.type || null,
    author:
      author?.id && author.id === filter.authorId ? author : null,
    lastName: filter.lastName || '',
    language: filter.language || '',
    title: filter.title || '',
    container:
      container?.id && container.id === filter.containerId ? container : null,
    yearMin: filter.yearPubMin || 0,
    yearMax: filter.yearPubMax || 0,
    key: filter.key || '',
    keyword: filter.keyword || '',
  };
}

function toFilter(draft: WorkFilterControls): WorkFilter {
  return {
    pageNumber: 1,
    pageSize: 10,
    matchAny: draft.matchAny,
    type: draft.type || undefined,
    authorId: draft.author?.id,
    lastName: draft.lastName || undefined,
    language: draft.language || undefined,
    title: draft.title || undefined,
    yearPubMin: draft.yearMin ?? 0,
    yearPubMax: draft.yearMax ?? 0,
    key: draft.key || undefined,
    keyword: draft.keyword || undefined,
    containerId: draft.container?.id,
  };
}

@Component({
  selector: 'biblio-work-filter',
  templateUrl: './work-filter.component.html',
  styleUrls: ['./work-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormField,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatInput,
    RefLookupComponent,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatHint,
  ],
})
export class WorkFilterComponent implements OnInit {
  /**
   * The filter being applied.
   */
  private readonly _filter = signal<WorkFilter>({
    pageNumber: 1,
    pageSize: 10,
  });

  public readonly persisted = input<boolean>(false);

  public readonly langEntries = input<ThesaurusEntry[]>();

  public readonly filterChange = output<WorkFilter>();

  // rebuilt whenever a filter is applied, reset or restored
  private readonly _draft = linkedSignal<WorkFilter, WorkFilterControls>({
    source: () => this._filter(),
    computation: (filter, previous) => toDraft(filter, previous?.value),
  });

  public readonly form = form(this._draft, (p) => {
    min(p.yearMin, 0);
    min(p.yearMax, 0);
  });

  public types: WorkType[];

  constructor(
    public authorLookupService: AuthorRefLookupService,
    public workLookupService: WorkRefLookupService,
    private _storageService: LocalStorageService,
    private _biblioService: BiblioService,
    private _biblioUtil: BiblioUtilService
  ) {
    this.types = [];
  }

  ngOnInit(): void {
    // load types once
    this._biblioService
      .getWorkTypes({
        pageNumber: 1,
        pageSize: 0,
      })
      .pipe(take(1))
      .subscribe((p) => {
        this.types = p.items;
      });

    // load if required
    if (this.persisted()) {
      const f = this._storageService.retrieve<WorkFilter>(
        WORK_FILTER_KEY,
        true
      );
      if (f) {
        this.setFilter(f);
        // apply the restored filter
        this.filterChange.emit(f);
      }
    }
  }

  /**
   * Set the filter being applied, loading its author and container
   * when they are not yet available.
   */
  private setFilter(filter: WorkFilter): void {
    this._filter.set(filter);
    const draft = this._draft();

    // load the author from its ID if any
    if (filter.authorId && !draft.author) {
      this._biblioService
        .getAuthor(filter.authorId)
        .pipe(take(1))
        .subscribe((a) => {
          // ignore a late response for a filter no longer applied
          if (this._filter() === filter) {
            this.form.author().value.set(a);
          }
        });
    }

    // load the container from its ID if any
    if (filter.containerId && !draft.container) {
      this._biblioService
        .getContainer(filter.containerId)
        .pipe(take(1))
        .subscribe((c) => {
          if (this._filter() === filter) {
            this.form.container().value.set(c);
          }
        });
    }
  }

  public onAuthorChange(author: unknown): void {
    this.form.author().value.set((author as Author) || null);
  }

  public onContainerChange(container: unknown): void {
    this.form.container().value.set((container as Container) || null);
  }

  public clearAuthor(): void {
    this.form.author().value.set(null);
  }

  public clearContainer(): void {
    this.form.container().value.set(null);
  }

  public authorToString(author: Author | null): string {
    return this._biblioUtil.authorToString(author);
  }

  public workToString(work: Container | null): string {
    return this._biblioUtil.workToString(work);
  }

  private saveFilter(filter: WorkFilter): void {
    this._storageService.store(WORK_FILTER_KEY, filter, true);
  }

  public reset(): void {
    const filter: WorkFilter = {
      pageNumber: 1,
      pageSize: 10,
    };
    this.setFilter(filter);
    this.saveFilter(filter);
    this.filterChange.emit(filter);
  }

  /**
   * Apply on Enter in a text input, as the former form did.
   */
  public onEnterKey(event: Event): void {
    if (!isImplicitSubmission(event)) {
      return;
    }
    event.preventDefault();
    this.apply();
  }

  public apply(): void {
    const filter = toFilter(this._draft());
    this.setFilter(filter);
    this.saveFilter(filter);
    this.filterChange.emit(filter);
  }
}
