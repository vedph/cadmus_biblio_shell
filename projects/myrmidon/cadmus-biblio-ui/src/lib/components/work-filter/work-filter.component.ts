import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BiblioService, WorkFilter } from '@myrmidon/cadmus-biblio-api';
import {
  Author,
  BiblioUtilService,
  Container,
  WorkType,
} from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { LocalStorageService } from '@myrmidon/ng-tools';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

const WORK_FILTER_KEY = 'cadmus-biblio-ui.work-filter';

@Component({
  selector: 'biblio-work-filter',
  templateUrl: './work-filter.component.html',
  styleUrls: ['./work-filter.component.css'],
})
export class WorkFilterComponent implements OnInit {
  private _filter$: BehaviorSubject<WorkFilter>;

  @Input()
  public persisted: boolean;

  @Input()
  public langEntries: ThesaurusEntry[] | undefined;

  @Output()
  public filterChange: EventEmitter<WorkFilter>;

  public form: FormGroup;
  public matchAny: FormControl;
  public type: FormControl;
  public author: FormControl;
  public lastName: FormControl;
  public language: FormControl;
  public title: FormControl;
  public container: FormControl;
  public yearMin: FormControl;
  public yearMax: FormControl;
  public key: FormControl;
  public keyword: FormControl;

  public types: WorkType[];

  constructor(
    formBuilder: FormBuilder,
    private _storageService: LocalStorageService,
    private _biblioService: BiblioService,
    private _biblioUtil: BiblioUtilService
  ) {
    this._filter$ = new BehaviorSubject<WorkFilter>({
      pageNumber: 1,
      pageSize: 10,
    });
    this.persisted = false;
    this.types = [];
    this.filterChange = new EventEmitter<WorkFilter>();
    // form
    this.matchAny = formBuilder.control(false);
    this.type = formBuilder.control(null);
    this.author = formBuilder.control(null);
    this.lastName = formBuilder.control(null);
    this.language = formBuilder.control(null);
    this.title = formBuilder.control(null);
    this.container = formBuilder.control(null); // container
    this.yearMin = formBuilder.control(0);
    this.yearMax = formBuilder.control(0);
    this.key = formBuilder.control(null);
    this.keyword = formBuilder.control(null); // prefix:value

    this.form = formBuilder.group({
      matchAny: this.matchAny,
      type: this.type,
      author: this.author,
      lastName: this.lastName,
      language: this.language,
      title: this.title,
      container: this.container,
      yearMin: this.yearMin,
      yearMax: this.yearMax,
      key: this.key,
      keyword: this.keyword,
    });
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

    // update this form whenever the filter is loaded
    this._filter$.subscribe((f) => {
      this.updateForm(f);
    });

    // load if required
    if (this.persisted) {
      const f = this._storageService.retrieve<WorkFilter>(
        WORK_FILTER_KEY,
        true
      );
      if (f) {
        this._filter$.next(f);
      }
    }
  }

  private updateForm(filter: WorkFilter): void {
    this.matchAny.setValue(filter.matchAny ? true : false);
    this.type.setValue(filter.type ? filter.type : null);
    this.lastName.setValue(filter.lastName);
    this.language.setValue(filter.language ? filter.language : null);
    this.title.setValue(filter.title);
    this.yearMin.setValue(filter.yearPubMin || 0);
    this.yearMax.setValue(filter.yearPubMax || 0);
    this.key.setValue(filter.key);
    this.keyword.setValue(filter.keyword);

    // load the author from his ID if any
    if (filter.authorId) {
      this._biblioService
        .getAuthor(filter.authorId)
        .pipe(take(1))
        .subscribe((a) => {
          this.author.setValue(a);
        });
    }

    // load the container from its container ID if any
    if (filter.containerId) {
      this._biblioService
        .getContainer(filter.containerId)
        .pipe(take(1))
        .subscribe((c) => {
          this.container.setValue(c);
        });
    } else {
      this.container.setValue(null);
    }

    this.form.markAsPristine();
  }

  private getFilter(): WorkFilter {
    return {
      pageNumber: 1,
      pageSize: 10,
      matchAny: this.matchAny.value,
      type: this.type.value,
      authorId: this.author.value?.id,
      lastName: this.lastName.value,
      language: this.language.value,
      title: this.title.value,
      yearPubMin: this.yearMin.value,
      yearPubMax: this.yearMax.value,
      key: this.key.value,
      keyword: this.keyword.value,
      containerId: this.container.value?.id,
    };
  }

  public onAuthorChange(author: Author): void {
    this.author.setValue(author);
  }

  public onContainerChange(container: Container): void {
    this.container.setValue(container);
  }

  public clearAuthor(): void {
    this.author.setValue(null);
  }

  public clearContainer(): void {
    this.container.setValue(null);
  }

  public authorToString(author: Author): string {
    return this._biblioUtil.authorToString(author);
  }

  public workToString(work: Container): string {
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
    this._filter$.next(filter);
    this.saveFilter(filter);
    this.filterChange.emit(filter);
  }

  public apply(): void {
    const filter = this.getFilter();
    this._filter$.next(filter);
    this.saveFilter(filter);
    this.filterChange.emit(filter);
  }
}
