import {
  Component,
  effect,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { ViewportScroller, AsyncPipe } from '@angular/common';
import { FormField, form } from '@angular/forms/signals';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { MatCheckbox } from '@angular/material/checkbox';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTooltip } from '@angular/material/tooltip';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
} from '@angular/material/expansion';

import { DataPage } from '@myrmidon/ngx-tools';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { WorkFilter } from '@myrmidon/cadmus-biblio-api';
import {
  BiblioUtilService,
  Container,
  Work,
  WorkAuthor,
  WorkInfo,
} from '@myrmidon/cadmus-biblio-core';

import { WorkFilterComponent } from '../work-filter/work-filter.component';
import { WorkDetailsComponent } from '../work-details/work-details.component';

@Component({
  selector: 'biblio-work-browser',
  templateUrl: './work-browser.component.html',
  styleUrls: ['./work-browser.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    WorkFilterComponent,
    MatCheckbox,
    FormField,
    MatButton,
    MatIcon,
    MatProgressBar,
    MatIconButton,
    MatTooltip,
    MatPaginator,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    WorkDetailsComponent,
    AsyncPipe,
  ],
})
export class WorkBrowserComponent implements OnInit, OnDestroy {
  private _sub?: Subscription;
  private _loadSub?: Subscription;
  private _filter: WorkFilter;

  public readonly pickEnabled = input<boolean>(true);
  public readonly editEnabled = input<boolean>(true);
  public readonly deleteEnabled = input<boolean>(true);
  public readonly addEnabled = input<boolean>(true);
  public readonly langEntries = input<ThesaurusEntry[]>();
  public readonly signals$ = input<BehaviorSubject<string>>(
    new BehaviorSubject<string>('')
  );
  public readonly pageSize = model<number>(20);

  public readonly workPick = output<WorkInfo>();
  public readonly workAdd = output<boolean>();
  public readonly workEdit = output<WorkInfo>();
  public readonly workDelete = output<WorkInfo>();

  /**
   * The browser options: whether to list containers rather than works.
   */
  public readonly options = form(signal({ isContainer: false }));

  public page$: BehaviorSubject<DataPage<WorkInfo>>;
  // signals: these are updated in HTTP callbacks, outside of template
  // events, so they must notify change detection
  public readonly loading = signal<boolean>(false);

  public readonly work = signal<Work | Container | undefined>(undefined);
  public readonly loadingWork = signal<boolean>(false);
  public readonly detailsOpen = signal<boolean>(false);

  constructor(
    private _biblioService: BiblioService,
    private _utilService: BiblioUtilService,
    private _scroller: ViewportScroller
  ) {
    this.page$ = new BehaviorSubject<DataPage<WorkInfo>>({
      total: 0,
      pageNumber: 1,
      pageSize: this.pageSize(),
      pageCount: 0,
      items: [],
    });
    this._filter = {
      pageNumber: 1,
      pageSize: this.pageSize(),
    };

    // load the first page, and reload whenever container/work changes
    effect(() => {
      this.options.isContainer().value();
      untracked(() => this.loadPage());
    });
  }

  private loadPage(): void {
    this.loading.set(true);
    this._filter.pageSize = this.pageSize();

    // cancel any pending load, so that a late response cannot
    // replace the page requested last
    this._loadSub?.unsubscribe();
    const page$ = this.options.isContainer().value()
      ? this._biblioService.getContainers(this._filter)
      : this._biblioService.getWorks(this._filter);
    this._loadSub = page$.pipe(take(1)).subscribe({
      next: (p) => {
        this.page$.next(p);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  public ngOnInit(): void {
    // handle received signals
    this._sub = this.signals$().subscribe((s) => {
      switch (s) {
        case 'refresh':
          this.loadPage();
          break;
      }
    });
  }

  public ngOnDestroy(): void {
    this._sub?.unsubscribe();
    this._loadSub?.unsubscribe();
  }

  public onPageChange(event: PageEvent): void {
    // https://material.angular.io/components/paginator/api
    this._filter.pageNumber = event.pageIndex + 1;
    this.pageSize.set(event.pageSize);
    this.loadPage();
  }

  public onFilterChange(filter: WorkFilter): void {
    // a new filter always starts from the first page
    this._filter = {
      ...filter,
      pageNumber: 1,
      pageSize: this.pageSize(),
    };
    this.loadPage();
  }

  public authorsToString(authors: WorkAuthor[] | undefined): string {
    if (!authors) {
      return '';
    }
    return authors.map((a) => this._utilService.authorToString(a)).join('; ');
  }

  public pickWork(work: WorkInfo): void {
    this.workPick.emit(work);
  }

  public addWork(): void {
    this.workAdd.emit(this.options.isContainer().value());
  }

  public editWork(work: WorkInfo): void {
    this.workEdit.emit(work);
  }

  public deleteWork(work: WorkInfo): void {
    this.workDelete.emit(work);
  }

  public viewDetails(work: WorkInfo): void {
    this.loadingWork.set(true);

    const work$: Observable<Work | Container> = work.isContainer
      ? this._biblioService.getContainer(work.id)
      : this._biblioService.getWork(work.id);
    work$.pipe(take(1)).subscribe({
      next: (w) => {
        this.work.set(w);
        this.loadingWork.set(false);
        this.detailsOpen.set(true);
        setTimeout(() => {
          this._scroller.scrollToAnchor('work-details');
        }, 0);
      },
      error: () => {
        this.loadingWork.set(false);
      },
    });
  }

  public workToString(work: Work | Container): string {
    return this._utilService.workToString(work);
  }
}
