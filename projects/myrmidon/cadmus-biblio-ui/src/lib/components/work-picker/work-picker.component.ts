import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { WorkBase } from '@myrmidon/cadmus-biblio-core';
import { WorkFilter } from '@myrmidon/cadmus-biblio-api';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { DataPage } from '@myrmidon/cadmus-core';

@Component({
  selector: 'biblio-work-picker',
  templateUrl: './work-picker.component.html',
  styleUrls: ['./work-picker.component.css'],
})
export class WorkPickerComponent implements OnInit {
  /**
   * The maximum count of works to retrieve. Default=10.
   */
  @Input()
  public limit: number;

  /**
   * The label attached to this picker.
   */
  @Input()
  public label: string | undefined;

  /**
   * True if the picker refers to containers; false if refers to works.
   */
  @Input()
  public container: boolean;

  @Output()
  public workChange: EventEmitter<WorkBase>;

  public form: FormGroup;
  public lookup: FormControl;
  public works$: Observable<DataPage<WorkBase>> | undefined;
  public work: WorkBase | undefined;

  constructor(formBuilder: FormBuilder, private _biblioService: BiblioService) {
    this.limit = 10;
    this.container = false;
    this.workChange = new EventEmitter<WorkBase>();
    // form
    this.lookup = formBuilder.control(null);
    this.form = formBuilder.group({
      lookup: this.lookup,
    });
  }

  private getFilter(filterText: string): WorkFilter {
    // match either title or author's last name
    return {
      pageNumber: 1,
      pageSize: 10,
      matchAny: true,
      title: filterText,
      lastName: filterText,
    };
  }

  ngOnInit(): void {
    if (!this.label) {
      this.label = this.container? 'work' : 'container';
    }

    this.works$ = this.lookup.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value: DataPage<WorkBase> | string) => {
        if (typeof value === 'string') {
          const filter = this.getFilter(value);
          return this.container
            ? this._biblioService.getContainers(filter)
            : this._biblioService.getWorks(filter);
        } else {
          return of(value);
        }
      })
    );
  }

  public clear(): void {
    this.work = undefined;
    this.lookup.setValue(null);
  }

  public workToString(work: WorkBase): string {
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

  public pickWork(work: WorkBase): void {
    this.work = work;
    this.workChange.emit(work);
  }
}
