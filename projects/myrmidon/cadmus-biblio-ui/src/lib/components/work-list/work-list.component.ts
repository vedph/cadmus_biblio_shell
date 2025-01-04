import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { ViewportScroller } from '@angular/common';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime, take } from 'rxjs/operators';

import { MatIconButton } from '@angular/material/button';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
} from '@angular/material/expansion';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { DialogService } from '@myrmidon/ngx-mat-tools';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import {
  BiblioUtilService,
  Container,
  EditedWork,
  Work,
  WorkAuthor,
  WorkInfo,
  WorkListEntry,
  BiblioWorkPipe,
} from '@myrmidon/cadmus-biblio-core';

import { WorkDetailsComponent } from '../work-details/work-details.component';
import { WorkBrowserComponent } from '../work-browser/work-browser.component';
import { WorkComponent } from '../work/work.component';

/**
 * A list of picked bibliographic entries.
 * This allows users to pick, edit, add or delete works. Also,
 * the user can add an optional tag and note to each picked
 * work.
 * The list of works picked is a list of generic WorkListEntry.
 * Users can add new entries to the list using the works browser,
 * edit any work from the browser, and see the details of a work
 * from either the entries list or the browser.
 */
@Component({
  selector: 'biblio-work-list',
  templateUrl: './work-list.component.html',
  styleUrls: ['./work-list.component.css'],
  animations: [
    trigger('drawer', [
      state('closed', style({ height: 0, overflow: 'hidden' })),
      state('open', style({ height: '300px', overflow: 'auto' })),
      transition('closed <=> open', [animate('300ms ease-in')]),
    ]),
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatError,
    MatInput,
    MatProgressSpinner,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    WorkDetailsComponent,
    WorkBrowserComponent,
    WorkComponent,
    BiblioWorkPipe,
  ],
})
export class WorkListComponent implements OnDestroy {
  private _entries: WorkListEntry[];
  private _subscriptions: Subscription[];

  @Input()
  public pickEnabled: boolean;
  @Input()
  public editEnabled: boolean;
  @Input()
  public deleteEnabled: boolean;
  @Input()
  public addEnabled: boolean;

  /**
   * The work entries.
   */
  @Input()
  public get entries(): WorkListEntry[] {
    return this._entries;
  }
  public set entries(value: WorkListEntry[]) {
    if (this._entries === value) {
      return;
    }
    this._entries = value || [];
    this.updateForm(this._entries);
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
  /**
   * Selected works tags entries.
   */
  @Input()
  public workTagEntries: ThesaurusEntry[] | undefined;
  // ext-biblio-link-scopes
  @Input()
  public scopeEntries: ThesaurusEntry[] | undefined;

  /**
   * Emitted when entries have been changed.
   */
  @Output()
  public entriesChange: EventEmitter<WorkListEntry[]>;

  public form: FormGroup;
  // this array is kept in synch with entries:
  public works: FormArray;

  public detailWork: Work | Container | undefined;
  public loadingDetailWork: boolean | undefined;
  public detailsOpen: boolean;

  public browserSignals$: BehaviorSubject<string>;

  public editedWork: EditedWork | undefined;
  public savingWork: boolean | undefined;

  public deletingWork: boolean | undefined;

  constructor(
    private _formBuilder: FormBuilder,
    private _clipboard: Clipboard,
    private _dialogService: DialogService,
    private _biblioService: BiblioService,
    private _utilService: BiblioUtilService,
    private _scroller: ViewportScroller
  ) {
    this.pickEnabled = true;
    this.editEnabled = true;
    this.deleteEnabled = true;
    this.addEnabled = true;
    this._entries = [];
    this._subscriptions = [];
    this.detailsOpen = false;
    this.browserSignals$ = new BehaviorSubject<string>('');
    this.entriesChange = new EventEmitter<WorkListEntry[]>();
    // form
    this.works = _formBuilder.array([]);
    this.form = _formBuilder.group({
      works: this.works,
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  public groupHasError(group: AbstractControl, name: string): boolean {
    const c = (group as FormGroup)?.controls[name] as FormControl;
    if (!c) {
      return false;
    }
    return c.errors && c.errors[name] && (c.dirty || c.touched);
  }

  private updateForm(entries: WorkListEntry[]): void {
    this.works.clear();
    this.cleanup();
    for (let e of entries) {
      this.works.controls.push(this.getWorkGroup(e));
    }
    this.form.markAsPristine();
  }

  private updateEntries(): void {
    for (let i = 0; i < this.works.length; i++) {
      const g = this.works.at(i) as FormGroup;
      this._entries[i].tag = g.controls['tag'].value?.trim();
      this._entries[i].note = g.controls['note'].value?.trim();
    }
  }

  private emitEntriesChange(): void {
    this.updateEntries();
    this.entriesChange.emit([...this._entries]);
  }

  public copyId(id: string): void {
    this._clipboard.copy(id);
  }

  private viewDetails(id: string, container: boolean): void {
    this.loadingDetailWork = true;

    if (container) {
      this._biblioService
        .getContainer(id)
        .pipe(take(1))
        .subscribe((w) => {
          this.detailWork = w;
          this.loadingDetailWork = false;
          this.detailsOpen = true;
        });
    } else {
      this._biblioService
        .getWork(id)
        .pipe(take(1))
        .subscribe((w) => {
          this.detailWork = w;
          this.loadingDetailWork = false;
          this.detailsOpen = true;
        });
    }
  }

  private edit(id: string | null, container: boolean): void {
    if (id) {
      if (container) {
        this._biblioService
          .getContainer(id)
          .pipe(take(1))
          .subscribe((c) => {
            this.editedWork = c;
            this.editedWork.isContainer = true;
            setTimeout(() => this._scroller.scrollToAnchor('work-editor'), 0);
          });
      } else {
        this._biblioService
          .getWork(id)
          .pipe(take(1))
          .subscribe((w) => {
            this.editedWork = w;
            this.editedWork.isContainer = false;
            setTimeout(() => this._scroller.scrollToAnchor('work-editor'), 0);
          });
      }
    } else {
      this.editedWork = {
        isContainer: container,
        key: '',
        authors: [],
        type: '',
        title: '',
        language: '',
      };
    }
  }

  //#region Entries
  private moveEntryUp(index: number): void {
    if (index < 1) {
      return;
    }
    const item = this._entries[index];
    this._entries.splice(index, 1);
    this._entries.splice(index - 1, 0, item);
  }

  private moveEntryDown(index: number): void {
    if (index + 1 >= this._entries.length) {
      return;
    }
    const item = this._entries[index];
    this._entries.splice(index, 1);
    this._entries.splice(index + 1, 0, item);
  }

  private removeEntry(index: number): void {
    this._entries.splice(index, 1);
    if (!this._entries.length) {
      this.detailWork = undefined;
    }
  }
  //#endregion

  //#region Works
  public authorsToString(authors: WorkAuthor[] | undefined): string {
    if (!authors) {
      return '';
    }
    return authors.map((a) => this._utilService.authorToString(a)).join('; ');
  }

  private cleanup(): void {
    this._subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }

  private getWorkGroup(work?: WorkListEntry): FormGroup {
    const g = this._formBuilder.group({
      tag: this._formBuilder.control(work?.tag, Validators.maxLength(50)),
      note: this._formBuilder.control(work?.note, Validators.maxLength(500)),
    });
    this._subscriptions.push(
      g.valueChanges.pipe(debounceTime(300)).subscribe(() => {
        this.form.markAsDirty();
        this.emitEntriesChange();
      })
    );
    return g;
  }

  public removeWork(index: number): void {
    this.works.removeAt(index);
    this.removeEntry(index);
    this.emitEntriesChange();
    this.works.markAsDirty();
  }

  public moveWorkUp(index: number): void {
    if (index < 1) {
      return;
    }
    const work = this.works.controls[index];
    this.works.removeAt(index);
    this.works.insert(index - 1, work);
    this.moveEntryUp(index);
    this.emitEntriesChange();
    this.works.markAsDirty();
  }

  public moveWorkDown(index: number): void {
    if (index + 1 >= this.works.length) {
      return;
    }
    const work = this.works.controls[index];
    this.works.removeAt(index);
    this.works.insert(index + 1, work);
    this.moveEntryDown(index);
    this.emitEntriesChange();
    this.works.markAsDirty();
  }

  public viewWorkDetails(entry: WorkListEntry): void {
    this.viewDetails(entry.id, entry.payload === 'c');
  }

  public editWork(entry: WorkListEntry): void {
    this.edit(entry.id, entry.payload === 'c');
  }
  //#endregion

  //#region Works Browser
  /**
   * Add the specified work to the list of entries.
   * @param work The work to add.
   */
  public pickBrowserWork(work: WorkInfo): void {
    if (this._entries.find((w) => w.id === work.id)) {
      return;
    }
    const entry: WorkListEntry = {
      id: work.id,
      label: this._utilService.workInfoToString(work),
      payload: work.isContainer ? 'c' : undefined,
    };
    this._entries.push(entry);
    const g = this.getWorkGroup(entry);
    this.works.controls.push(g);
    this.form.markAsDirty();
    this.emitEntriesChange();
  }

  /**
   * Add a new work to the database.
   */
  public addBrowserWork(container: boolean): void {
    this.edit(null, container);
  }

  /**
   * Edit the specified work from the browser.
   */
  public editBrowserWork(work: WorkInfo): void {
    this.edit(work.id, work.isContainer);
  }

  private removeDeletedWork(work: WorkInfo): void {
    // remove the entry from list if it was deleted
    const index = this._entries.findIndex((e) => e.id === work.id);
    if (index > -1) {
      this.works.removeAt(index);
      this._entries.splice(index, 1);
      this.form.markAsDirty();
      this.emitEntriesChange();
    }
  }

  /**
   * Delete work from the database.
   */
  public deleteBrowserWork(work: WorkInfo): void {
    this._dialogService
      .confirm(
        'Confirmation',
        `Delete ${work.isContainer ? 'container' : 'work'} from database?`
      )
      .pipe(take(1))
      .subscribe((yes) => {
        this.deletingWork = true;
        if (yes) {
          if (work.isContainer) {
            this._biblioService
              .deleteContainer(work.id)
              .pipe(take(1))
              .subscribe((_) => {
                this.deletingWork = false;
                // signal browser to refresh itself
                this.browserSignals$.next('refresh');
                this.removeDeletedWork(work);
              });
          } else {
            this._biblioService
              .deleteWork(work.id)
              .pipe(take(1))
              .subscribe((_) => {
                this.deletingWork = false;
                // signal browser to refresh itself
                this.browserSignals$.next('refresh');
                this.removeDeletedWork(work);
              });
          }
        }
      });
  }
  //#endregion

  // #region Work editor
  private onWorkSaved(container: boolean, work: Work): void {
    // signal browser to refresh itself
    this.browserSignals$.next('refresh');

    // refresh the entry in list if it was edited
    const index = this._entries.findIndex((e) => e.id === work.id);
    if (index > -1) {
      const entry = {
        id: work.id || '',
        label: this._utilService.workToString(work),
        payload: container ? 'c' : undefined,
      };
      // (no change for works)
      this._entries.splice(index, 1, entry);
      this.form.markAsDirty();
      this.emitEntriesChange();
    }
  }

  /**
   * Save the edited work.
   * @param work The work to be saved.
   */
  public onWorkChange(work: EditedWork): void {
    // save
    this.savingWork = true;

    if (work.isContainer) {
      this._biblioService.addContainer(work).subscribe((w) => {
        this.onWorkSaved(true, w);
        this.savingWork = false;
        this.closeEditor();
      });
    } else {
      this._biblioService.addWork(work).subscribe((w) => {
        this.onWorkSaved(false, w);
        this.savingWork = false;
        this.closeEditor();
      });
    }
  }

  /**
   * Close the work being edited without saving.
   */
  public closeEditor(): void {
    this.editedWork = undefined;
  }
  //#endregion
}
