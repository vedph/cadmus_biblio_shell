import { Component, effect, input, model, OnDestroy } from '@angular/core';
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
  private _subs: Subscription[];
  private _dropNextInput?: boolean;

  public readonly pickEnabled = input<boolean>(true);
  public readonly editEnabled = input<boolean>(true);
  public readonly deleteEnabled = input<boolean>(true);
  public readonly addEnabled = input<boolean>(true);

  /**
   * The work entries.
   */
  public readonly entries = model<WorkListEntry[]>([]);

  /**
   * Authors roles entries.
   */
  public readonly roleEntries = input<ThesaurusEntry[]>();
  /**
   * Keywords language entries.
   */
  public readonly langEntries = input<ThesaurusEntry[]>();
  /**
   * Selected works tags entries.
   */
  public readonly workTagEntries = input<ThesaurusEntry[]>();
  // ext-biblio-link-scopes
  public readonly scopeEntries = input<ThesaurusEntry[]>();

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
    this._subs = [];
    this.detailsOpen = false;
    this.browserSignals$ = new BehaviorSubject<string>('');
    // form
    this.works = _formBuilder.array([]);
    this.form = _formBuilder.group({
      works: this.works,
    });

    effect(() => {
      if (this._dropNextInput) {
        this._dropNextInput = false;
        return;
      }
      this.updateForm(this.entries());
    });
  }

  private cleanup(): void {
    this._subs.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
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

  private getEntries(): WorkListEntry[] {
    const entries: WorkListEntry[] = [];

    for (let i = 0; i < this.works.length; i++) {
      const g = this.works.at(i) as FormGroup;
      entries.push({
        ...this.entries()[i],
        tag: g.controls['tag'].value?.trim(),
        note: g.controls['note'].value?.trim(),
      });
    }
    return entries;
  }

  public copyWorkId(index: number): void {
    const entry = this.entries()[index];
    this._clipboard.copy(entry.id);
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
    const entries = [...this.entries()];
    const item = entries[index];
    entries.splice(index, 1);
    entries.splice(index - 1, 0, item);
    this.entries.set(entries);
  }

  private moveEntryDown(index: number): void {
    if (index + 1 >= this.entries().length) {
      return;
    }
    const entries = [...this.entries()];
    const item = entries[index];
    entries.splice(index, 1);
    entries.splice(index + 1, 0, item);
    this.entries.set(entries);
  }

  private removeEntry(index: number): void {
    const entries = [...this.entries()];
    entries.splice(index, 1);
    if (!entries.length) {
      this.detailWork = undefined;
    }
    this.entries.set(entries);
  }
  //#endregion

  //#region Works
  public authorsToString(authors: WorkAuthor[] | undefined): string {
    if (!authors) {
      return '';
    }
    return authors.map((a) => this._utilService.authorToString(a)).join('; ');
  }

  private getWorkGroup(work?: WorkListEntry): FormGroup {
    const g = this._formBuilder.group({
      tag: this._formBuilder.control(work?.tag, Validators.maxLength(50)),
      note: this._formBuilder.control(work?.note, Validators.maxLength(500)),
    });
    this._subs.push(
      g.valueChanges.pipe(debounceTime(300)).subscribe(() => {
        this.form.markAsDirty();
        this._dropNextInput = true;
        this.entries.set(this.getEntries());
      })
    );
    return g;
  }

  public removeWork(index: number): void {
    this.works.removeAt(index);
    this.removeEntry(index);
    this.entries.set(this.getEntries());
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
    this.entries.set(this.getEntries());
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
    this.entries.set(this.getEntries());
    this.works.markAsDirty();
  }

  public viewWorkDetails(index: number): void {
    const entry = this.entries()[index];
    this.viewDetails(entry.id, entry.payload === 'c');
  }

  public editWork(index: number): void {
    const entry = this.entries()[index];
    this.edit(entry.id, entry.payload === 'c');
  }
  //#endregion

  //#region Works Browser
  /**
   * Add the specified work to the list of entries.
   * @param work The work to add.
   */
  public pickBrowserWork(work: WorkInfo): void {
    const entries = [...this.entries()];
    if (entries.find((w) => w.id === work.id)) {
      return;
    }
    const entry: WorkListEntry = {
      id: work.id,
      label: this._utilService.workInfoToString(work),
      payload: work.isContainer ? 'c' : undefined,
    };
    entries.push(entry);
    this.entries.set(entries);
    const g = this.getWorkGroup(entry);
    this.works.controls.push(g);
    this.form.markAsDirty();
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
    const entries = [...this.entries()];
    const index = entries.findIndex((e) => e.id === work.id);
    if (index > -1) {
      this.works.removeAt(index);
      entries.splice(index, 1);
      this.entries.set(entries);
      this.form.markAsDirty();
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
    const entries = [...this.entries()];
    const index = entries.findIndex((e) => e.id === work.id);
    if (index > -1) {
      const entry = {
        id: work.id || '',
        label: this._utilService.workToString(work),
        payload: container ? 'c' : undefined,
      };
      // (no change for works)
      entries.splice(index, 1, entry);
      this.entries.set(entries);
      this.form.markAsDirty();
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
