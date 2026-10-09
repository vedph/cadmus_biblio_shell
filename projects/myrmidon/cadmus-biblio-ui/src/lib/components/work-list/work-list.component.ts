import {
  Component,
  effect,
  input,
  linkedSignal,
  model,
  signal,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  FormField,
  applyEach,
  form,
  maxLength,
} from '@angular/forms/signals';
import { Clipboard } from '@angular/cdk/clipboard';
import { ViewportScroller } from '@angular/common';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { BehaviorSubject, Observable } from 'rxjs';
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
 * An entry of the list, with its editable tag and note.
 */
interface WorkListRow {
  id: string;
  label: string;
  payload: string | undefined;
  tag: string;
  note: string;
}

interface WorkListControls {
  works: WorkListRow[];
}

/**
 * Entries -> draft. Each row is a new object: the form tags the objects
 * in its arrays, so the caller's objects must not be adopted.
 */
function toDraft(entries: WorkListEntry[] | undefined): WorkListControls {
  return {
    works: (entries || []).map((e) => ({
      id: e.id,
      label: e.label,
      payload: e.payload,
      tag: e.tag || '',
      note: e.note || '',
    })),
  };
}

/**
 * Draft -> entries. This normalizes the tag and note (trimming them, and
 * saving empty values as undefined), so its result can differ from the
 * draft: see the echo note on _draft.
 */
function toEntries(draft: WorkListControls): WorkListEntry[] {
  return draft.works.map((r) => ({
    id: r.id,
    label: r.label,
    payload: r.payload,
    tag: r.tag.trim() || undefined,
    note: r.note.trim() || undefined,
  }));
}

/**
 * A list of picked bibliographic entries.
 * This allows users to pick, edit, add or delete works. Also,
 * the user can add an optional tag and note to each picked
 * work.
 * The list of works picked is a list of generic WorkListEntry.
 * Users can add new entries to the list using the works browser,
 * edit any work from the browser, and see the details of a work
 * from either the entries list or the browser.
 * Changes to tags and notes are saved into the entries after
 * a short pause in typing.
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
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormField,
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
export class WorkListComponent {
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

  /**
   * The editable draft of the entries.
   *
   * `previous` tells an external change apart from the echo of our own
   * save. `toEntries()` normalizes, so saving the entries produces a value
   * which differs from the draft; without this check, the incoming echo
   * would rebuild the draft and stomp what the user is still typing (e.g.
   * a tag "abc " would be saved as "abc", and the next keystroke would
   * give "abcd" rather than "abc d").
   */
  private readonly _draft = linkedSignal<
    WorkListEntry[] | undefined,
    WorkListControls
  >({
    source: () => this.entries(),
    computation: (entries, previous) =>
      previous &&
      JSON.stringify(entries) === JSON.stringify(toEntries(previous.value))
        ? previous.value
        : toDraft(entries),
  });

  public readonly form = form(this._draft, (p) => {
    applyEach(p.works, (w) => {
      maxLength(w.tag, 50);
      maxLength(w.note, 500);
    });
  });

  // signals: these are updated in HTTP callbacks, outside of template
  // events, so they must notify change detection
  public readonly detailWork = signal<Work | Container | undefined>(undefined);
  public readonly loadingDetailWork = signal<boolean>(false);
  public readonly detailsOpen = signal<boolean>(false);

  public browserSignals$: BehaviorSubject<string>;

  public readonly editedWork = signal<EditedWork | undefined>(undefined);
  public savingWork: boolean | undefined;

  public deletingWork: boolean | undefined;

  constructor(
    private _clipboard: Clipboard,
    private _dialogService: DialogService,
    private _biblioService: BiblioService,
    private _utilService: BiblioUtilService,
    private _scroller: ViewportScroller
  ) {
    this.browserSignals$ = new BehaviorSubject<string>('');

    // once the draft mirrors the bound entries again, clear the
    // interaction state. This is keyed on the draft: on an echo of our
    // own save the draft does not change, so validation errors are not
    // cleared while the user is typing.
    effect(() => {
      const draft = this._draft();
      untracked(() => {
        if (this.isDraftInSync(draft)) {
          this.form().reset();
        }
      });
    });

    // save tag and note changes after a pause in typing
    toObservable(this._draft)
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => {
        // skip while the draft still mirrors the bound entries: otherwise
        // just receiving entries would save a normalized copy of them
        if (this.isDraftInSync(this._draft())) {
          return;
        }
        this.entries.set(toEntries(this._draft()));
      });
  }

  /**
   * True when the draft still mirrors the bound entries,
   * i.e. there is nothing to save.
   */
  private isDraftInSync(draft: WorkListControls): boolean {
    return JSON.stringify(draft) === JSON.stringify(toDraft(this.entries()));
  }

  /**
   * Get the entries from the draft, which include any tag/note
   * change not yet saved (debounced).
   */
  private getEntries(): WorkListEntry[] {
    return toEntries(this._draft());
  }

  public copyWorkId(index: number): void {
    this._clipboard.copy(this._draft().works[index].id);
  }

  private viewDetails(id: string, container: boolean): void {
    this.loadingDetailWork.set(true);

    const work$: Observable<Work | Container> = container
      ? this._biblioService.getContainer(id)
      : this._biblioService.getWork(id);
    work$.pipe(take(1)).subscribe({
      next: (w) => {
        this.detailWork.set(w);
        this.loadingDetailWork.set(false);
        this.detailsOpen.set(true);
      },
      error: () => {
        this.loadingDetailWork.set(false);
      },
    });
  }

  private edit(id: string | null, container: boolean): void {
    if (id) {
      const work$: Observable<Work | Container> = container
        ? this._biblioService.getContainer(id)
        : this._biblioService.getWork(id);
      work$.pipe(take(1)).subscribe((w) => {
        this.editedWork.set({ ...w, isContainer: container });
        setTimeout(() => this._scroller.scrollToAnchor('work-editor'), 0);
      });
    } else {
      this.editedWork.set({
        isContainer: container,
        key: '',
        authors: [],
        type: '',
        title: '',
        language: '',
      });
    }
  }

  //#region Works
  public authorsToString(authors: WorkAuthor[] | undefined): string {
    if (!authors) {
      return '';
    }
    return authors.map((a) => this._utilService.authorToString(a)).join('; ');
  }

  public removeWork(index: number): void {
    const entries = this.getEntries();
    entries.splice(index, 1);
    if (!entries.length) {
      this.detailWork.set(undefined);
    }
    this.entries.set(entries);
  }

  public moveWorkUp(index: number): void {
    if (index < 1) {
      return;
    }
    const entries = this.getEntries();
    const entry = entries[index];
    entries.splice(index, 1);
    entries.splice(index - 1, 0, entry);
    this.entries.set(entries);
  }

  public moveWorkDown(index: number): void {
    const entries = this.getEntries();
    if (index + 1 >= entries.length) {
      return;
    }
    const entry = entries[index];
    entries.splice(index, 1);
    entries.splice(index + 1, 0, entry);
    this.entries.set(entries);
  }

  public viewWorkDetails(index: number): void {
    const entry = this._draft().works[index];
    this.viewDetails(entry.id, entry.payload === 'c');
  }

  public editWork(index: number): void {
    const entry = this._draft().works[index];
    this.edit(entry.id, entry.payload === 'c');
  }
  //#endregion

  //#region Works Browser
  /**
   * Add the specified work to the list of entries.
   * @param work The work to add.
   */
  public pickBrowserWork(work: WorkInfo): void {
    const entries = this.getEntries();
    if (entries.find((w) => w.id === work.id)) {
      return;
    }
    entries.push({
      id: work.id,
      label: this._utilService.workInfoToString(work),
      payload: work.isContainer ? 'c' : undefined,
    });
    this.entries.set(entries);
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
    const entries = this.getEntries();
    const index = entries.findIndex((e) => e.id === work.id);
    if (index > -1) {
      entries.splice(index, 1);
      this.entries.set(entries);
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
        if (yes) {
          this.deletingWork = true;
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
    const entries = this.getEntries();
    const index = entries.findIndex((e) => e.id === work.id);
    if (index > -1) {
      entries.splice(index, 1, {
        // keep the entry's tag and note
        ...entries[index],
        id: work.id || '',
        label: this._utilService.workToString(work),
        payload: container ? 'c' : undefined,
      });
      this.entries.set(entries);
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
    this.editedWork.set(undefined);
  }
  //#endregion
}
