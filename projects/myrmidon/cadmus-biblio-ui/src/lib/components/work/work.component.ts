import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  Container,
  Keyword,
  Work,
  WorkAuthor,
  WorkBase,
  WorkType,
  WorkKeyService,
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
  private _model: Work | Container | undefined;

  @Input()
  public get model(): Work | Container | undefined {
    return this._model;
  }
  public set model(value: Work | Container | undefined) {
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
  public modelChange: EventEmitter<Work | Container>;
  @Output()
  public editorClose: EventEmitter<any>;

  public form: FormGroup;
  public isContainer: FormControl;
  public type: FormControl;
  public key: FormControl;
  public authors: FormControl;
  public title: FormControl;
  public language: FormControl;
  public placePub: FormControl;
  public yearPub: FormControl;
  public publisher: FormControl;
  public containerId: FormControl;
  public firstPage: FormControl;
  public lastPage: FormControl;
  public number: FormControl;
  public note: FormControl;
  public location: FormControl;
  public hasAccessDate: FormControl;
  public accessDate: FormControl;
  public keywords: FormControl;

  public types$: Observable<WorkType[]> | undefined;
  public container: Container | undefined;

  constructor(
    formBuilder: FormBuilder,
    private _biblioService: BiblioService,
    private _workKeyService: WorkKeyService
  ) {
    this.modelChange = new EventEmitter<Work | Container>();
    this.editorClose = new EventEmitter<any>();

    // form
    this.isContainer = formBuilder.control(false);
    this.type = formBuilder.control(null, Validators.required);
    this.key = formBuilder.control(null, Validators.maxLength(300));
    this.authors = formBuilder.control([], Validators.required);
    this.title = formBuilder.control(null, [
      Validators.required,
      Validators.maxLength(200),
    ]);
    this.language = formBuilder.control(null, [
      Validators.required,
      Validators.pattern('^[a-z]{3}$'),
    ]);
    this.placePub = formBuilder.control(null, Validators.maxLength(100));
    this.yearPub = formBuilder.control(0);
    this.publisher = formBuilder.control(null, Validators.maxLength(50));
    this.containerId = formBuilder.control(null);
    this.firstPage = formBuilder.control(0);
    this.lastPage = formBuilder.control(0);
    this.number = formBuilder.control(null, Validators.maxLength(50));
    this.note = formBuilder.control(null, Validators.maxLength(500));
    this.location = formBuilder.control(null, Validators.maxLength(500));
    this.hasAccessDate = formBuilder.control(false);
    this.accessDate = formBuilder.control(null);
    this.keywords = formBuilder.control([]);
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
      containerId: this.containerId,
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

  private updateForm(model: Work | Container | undefined): void {
    if (!model) {
      this.form.reset();
      return;
    }

    const work = model as Work;
    const container = model as Container;

    this.type.setValue(model.type);
    this.key.setValue(model.key);
    this.authors.setValue(model.authors || []);
    this.title.setValue(model.title);
    this.language.setValue(model.language);
    this.placePub.setValue(model.placePub);
    this.yearPub.setValue(model.yearPub);
    this.publisher.setValue(model.publisher);
    this.containerId.setValue(work.container?.id);
    this.container = work.container;
    this.firstPage.setValue(work.firstPage);
    this.lastPage.setValue(work.lastPage);
    this.number.setValue(container.number);
    this.note.setValue(model.note);
    this.location.setValue(model.location);
    this.hasAccessDate.setValue(model.accessDate ? true : false);
    this.accessDate.setValue(model.accessDate);
    this.keywords.setValue(model.keywords);

    // if it has a container it can't be a container
    if (work.container) {
      this.isContainer.setValue(false);
    }

    this.form.markAsPristine();
  }

  private getModel(): Work | Container {
    return {
      type: this.type.value,
      key: this.key.value?.trim(),
      authors: this.authors.value?.length ? this.authors.value : undefined,
      title: this.title.value?.trim(),
      language: this.language.value,
      placePub: this.placePub.value?.trim(),
      yearPub: this.yearPub.value,
      publisher: this.publisher.value?.trim(),
      container: this.containerId.value,
      firstPage: this.firstPage.value,
      lastPage: this.lastPage.value,
      number: this.number.value?.trim(),
      note: this.note.value?.trim(),
      location: this.location.value?.trim(),
      accessDate: this.hasAccessDate.value ? this.accessDate.value : undefined,
      keywords: this.keywords.value?.length ? this.keywords.value : undefined,
    };
  }

  public onAuthorsChange(authors: WorkAuthor[]): void {
    this.authors.setValue(authors || []);
  }

  public onKeywordsChange(keywords: Keyword[]): void {
    this.keywords.setValue(keywords || []);
  }

  public onContainerChange(container: Container | undefined): void {
    this.containerId.setValue(container?.id);
    this.container = container;
  }

  public workToString(work?: WorkBase): string {
    if (!work) {
      return '';
    }
    const sb: string[] = [];
    if (work.authors?.length) {
      for (let i = 0; i < work.authors.length; i++) {
        if (i > 0) {
          sb.push(' & ');
        }
        sb.push(work.authors[i].last);
      }
    }

    if (work.title) {
      sb.push(' - ');
      sb.push(work.title);
    }

    if (work.yearPub) {
      sb.push(', ');
      sb.push(work.yearPub.toString());
    }
    return sb.join('');
  }

  public buildKey(): void {
    this.key.setValue(this._workKeyService.buildKey(this.getModel()));
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
