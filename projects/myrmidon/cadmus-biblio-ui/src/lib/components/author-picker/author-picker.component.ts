import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BiblioService, AuthorFilter } from '@myrmidon/cadmus-biblio-api';
import { Author, BiblioUtilService } from '@myrmidon/cadmus-biblio-core';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'biblio-author-picker',
  templateUrl: './author-picker.component.html',
  styleUrls: ['./author-picker.component.css'],
})
export class AuthorPickerComponent implements OnInit {
  /**
   * The maximum count of works to retrieve. Default=10.
   */
  @Input()
  public limit: number;

  /**
   * The label attached to this picker. Default=work or container.
   */
  @Input()
  public label: string;

  /**
   * Fired when a author is selected.
   */
  @Output()
  public authorChange: EventEmitter<Author>;
  public form: FormGroup;
  public lookup: FormControl;
  public authors$: Observable<Author[]> | undefined;
  public author: Author | undefined;

  constructor(
    formBuilder: FormBuilder,
    private _biblioService: BiblioService,
    private _utilService: BiblioUtilService
  ) {
    this.limit = 10;
    this.label = 'author';
    this.authorChange = new EventEmitter<Author>();
    // form
    this.lookup = formBuilder.control(null);
    this.form = formBuilder.group({
      lookup: this.lookup,
    });
  }

  private getFilter(filterText: string): AuthorFilter {
    return {
      pageNumber: 1,
      pageSize: this.limit,
      last: filterText,
    };
  }

  ngOnInit(): void {
    this.authors$ = this.lookup.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value: Author | string) => {
        if (typeof value === 'string') {
          const filter = this.getFilter(value);
          return this._biblioService.getAuthors(filter).pipe(
            switchMap((p) => {
              return of(p.items as Author[]);
            })
          );
        } else {
          return of([value]);
        }
      })
    );
  }

  public clear(): void {
    this.author = undefined;
    this.lookup.setValue(null);
  }

  public authorToString(author: Author): string {
    return this._utilService?.authorToString(author);
  }

  public pickAuthor(author: Author): void {
    this.authorChange.emit(author);
    this.clear();
  }
}
