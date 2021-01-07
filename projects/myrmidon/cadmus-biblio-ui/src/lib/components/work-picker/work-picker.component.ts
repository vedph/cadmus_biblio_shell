import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { WorkBase } from '@myrmidon/cadmus-biblio-core';
import { WorkFilter } from '@myrmidon/cadmus-biblio-api';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'biblio-work-picker',
  templateUrl: './work-picker.component.html',
  styleUrls: ['./work-picker.component.css'],
})
export class WorkPickerComponent implements OnInit {
  public form: FormGroup;
  public filter: FormControl;
  public works$: BehaviorSubject<WorkBase[]>;

  /**
   * True if the picker refers to containers; false if refers to works.
   */
  @Input()
  public container: boolean;

  constructor(formBuilder: FormBuilder, private _biblioService: BiblioService) {
    this.container = false;
    this.works$ = new BehaviorSubject<WorkBase[]>([]);
    // form
    this.filter = formBuilder.control(null);
    this.form = formBuilder.group({
      filter: this.filter,
    });
  }

  ngOnInit(): void {
    this.filter.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged())
      .subscribe((f) => {
        this.search(f);
      });
  }

  private search(filterText: string): void {
    const filter: WorkFilter = {
      pageNumber: 1,
      pageSize: 10,
      matchAny: true,
      title: filterText,
      lastName: filterText
    };

    if (this.container) {
      this._biblioService.getContainers(filter).subscribe(page => {
        this.works$.next(page.items);
      });
    } else {
      this._biblioService.getWorks(filter).subscribe(page => {
        this.works$.next(page.items);
      });
    }
  }

  // TODO: add workToString using key or other properties when no key
  // and call it from mat-option
}
