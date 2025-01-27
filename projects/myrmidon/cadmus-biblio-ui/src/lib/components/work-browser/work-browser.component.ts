import {
  Component,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { ViewportScroller, AsyncPipe } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
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
  imports: [
    WorkFilterComponent,
    MatCheckbox,
    FormsModule,
    ReactiveFormsModule,
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

  public isContainer: FormControl<boolean>;

  public page$: BehaviorSubject<DataPage<WorkInfo>>;
  public loading: boolean | undefined;

  public work: Work | Container | undefined;
  public loadingWork: boolean | undefined;
  public detailsOpen: boolean;

  constructor(
    formBuilder: FormBuilder,
    private _biblioService: BiblioService,
    private _utilService: BiblioUtilService,
    private _scroller: ViewportScroller
  ) {
    this.detailsOpen = false;
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
    // form
    this.isContainer = formBuilder.control(false, { nonNullable: true });
  }

  private loadPage(): void {
    this.loading = true;
    this._filter.pageSize = this.pageSize();

    if (this.isContainer.value) {
      this._biblioService
        .getContainers(this._filter)
        .pipe(take(1))
        .subscribe((p) => {
          this.page$.next(p);
          this.loading = false;
        });
    } else {
      this._biblioService
        .getWorks(this._filter)
        .pipe(take(1))
        .subscribe((p) => {
          this.page$.next(p);
          this.loading = false;
        });
    }
  }

  public ngOnInit(): void {
    this.loadPage();

    // whenever container/work changes, reload page
    this.isContainer.valueChanges.subscribe((c) => {
      this.loadPage();
    });

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
  }

  public onPageChange(event: PageEvent): void {
    // https://material.angular.io/components/paginator/api
    this._filter.pageNumber = event.pageIndex + 1;
    this.pageSize.set(event.pageSize);
    this.loadPage();
  }

  public onFilterChange(filter: WorkFilter): void {
    this._filter = filter;
    // override paging options
    this._filter.pageNumber = this.page$.value.pageNumber;
    this._filter.pageSize = this.page$.value.pageSize;
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
    this.workAdd.emit(this.isContainer.value);
  }

  public editWork(work: WorkInfo): void {
    this.workEdit.emit(work);
  }

  public deleteWork(work: WorkInfo): void {
    this.workDelete.emit(work);
  }

  public viewDetails(work: WorkInfo): void {
    this.loadingWork = true;

    if (work.isContainer) {
      this._biblioService
        .getContainer(work.id)
        .pipe(take(1))
        .subscribe((w) => {
          this.work = w;
          this.loadingWork = false;
          this.detailsOpen = true;
          setTimeout(() => {
            this._scroller.scrollToAnchor('work-details');
          }, 0);
        });
    } else {
      this._biblioService
        .getWork(work.id)
        .pipe(take(1))
        .subscribe((w) => {
          this.work = w;
          this.loadingWork = false;
          this.detailsOpen = true;
          setTimeout(() => {
            this._scroller.scrollToAnchor('work-details');
          }, 0);
        });
    }
  }

  public workToString(work: Work | Container): string {
    return this._utilService.workToString(work);
  }
}
