import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ViewportScroller } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { WorkFilter } from '@myrmidon/cadmus-biblio-api';
import {
  BiblioUtilService,
  Container,
  Work,
  WorkAuthor,
  WorkInfo,
} from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { FormBuilder, FormControl } from '@angular/forms';
import { DataPage } from '@myrmidon/ng-tools';

@Component({
  selector: 'biblio-work-browser',
  templateUrl: './work-browser.component.html',
  styleUrls: ['./work-browser.component.css'],
})
export class WorkBrowserComponent implements OnInit {
  private _filter: WorkFilter;

  @Input()
  public pickEnabled: boolean;
  @Input()
  public editEnabled: boolean;
  @Input()
  public deleteEnabled: boolean;
  @Input()
  public addEnabled: boolean;
  @Input()
  public langEntries: ThesaurusEntry[] | undefined;
  @Input()
  public signals$: BehaviorSubject<string>;
  @Input()
  public pageSize: number;
  @Output()
  public workPick: EventEmitter<WorkInfo>;
  @Output()
  public workAdd: EventEmitter<boolean>;
  @Output()
  public workEdit: EventEmitter<WorkInfo>;
  @Output()
  public workDelete: EventEmitter<WorkInfo>;

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
    this.pickEnabled = true;
    this.editEnabled = true;
    this.deleteEnabled = true;
    this.addEnabled = true;
    this.detailsOpen = false;
    this.signals$ = new BehaviorSubject<string>('');
    this.workPick = new EventEmitter<WorkInfo>();
    this.workAdd = new EventEmitter<boolean>();
    this.workEdit = new EventEmitter<WorkInfo>();
    this.workDelete = new EventEmitter<WorkInfo>();
    this.pageSize = 20;
    this.page$ = new BehaviorSubject<DataPage<WorkInfo>>({
      total: 0,
      pageNumber: 1,
      pageSize: this.pageSize,
      pageCount: 0,
      items: [],
    });
    this._filter = {
      pageNumber: 1,
      pageSize: this.pageSize,
    };
    // form
    this.isContainer = formBuilder.control(false, { nonNullable: true });
  }

  private loadPage(): void {
    this.loading = true;
    this._filter.pageSize = this.pageSize;

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

  ngOnInit(): void {
    this.loadPage();

    // whenever container/work changes, reload page
    this.isContainer.valueChanges.subscribe((c) => {
      this.loadPage();
    });

    // handle received signals
    this.signals$.subscribe((s) => {
      switch (s) {
        case 'refresh':
          this.loadPage();
          break;
      }
    });
  }

  public onPageChange(event: PageEvent): void {
    // https://material.angular.io/components/paginator/api
    this._filter.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
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
