import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import {
  BiblioUtilService,
  Container,
  EditedWork,
  Work,
  WorkAuthor,
  WorkInfo,
  WorkListEntry,
} from '@myrmidon/cadmus-biblio-core';
import { DialogService } from '@myrmidon/cadmus-ui';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

/**
 * A list of picked bibliographic entries.
 * This allows users to pick, edit, add or delete works.
 * The list of works picked is a list of generic WorkListEntry.
 * Users can add new entries to the list using the works browser,
 * edit any work from the browser, and see the details of a work
 * from either the entries list or the browser.
 */
@Component({
  selector: 'biblio-work-list',
  templateUrl: './work-list.component.html',
  styleUrls: ['./work-list.component.css'],
})
export class WorkListComponent implements OnInit {
  private _entries: WorkListEntry[];

  /**
   * The work entries.
   */
  @Input()
  public get entries(): WorkListEntry[] {
    return this._entries;
  }
  public set entries(value: WorkListEntry[]) {
    this._entries = value || [];
    this.count.setValue(this._entries.length);
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

  public form: FormGroup;
  public count: FormControl;

  public detailWork: Work | Container | undefined;
  public loadingDetailWork: boolean | undefined;
  public detailsOpen: boolean;

  public browserSignals$: BehaviorSubject<string>;

  public editedWork: Work | Container | undefined;
  public savingWork: boolean | undefined;

  public deletingWork: boolean | undefined;

  constructor(
    formBuilder: FormBuilder,
    private _clipboard: Clipboard,
    private _dialogService: DialogService,
    private _biblioService: BiblioService,
    private _utilService: BiblioUtilService
  ) {
    this._entries = [];
    this.detailsOpen = false;
    this.browserSignals$ = new BehaviorSubject<string>('');
    // form
    this.count = formBuilder.control(0, Validators.min(1));
    this.form = formBuilder.group({
      count: this.count,
    });
  }

  ngOnInit(): void {}

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
          });
      } else {
        this._biblioService
          .getWork(id)
          .pipe(take(1))
          .subscribe((w) => {
            this.editedWork = w;
          });
      }
    } else {
      this.editedWork = {
        key: '',
        authors: [],
        type: '',
        title: '',
        language: ''
      };
    }
  }

  //#region Entries
  public authorsToString(authors: WorkAuthor[] | undefined): string {
    if (!authors) {
      return '';
    }
    return authors.map((a) => this._utilService.authorToString(a)).join('; ');
  }

  public workToString(work: Work | Container): string {
    return this._utilService.workToString(work);
  }

  public moveEntryUp(index: number): void {
    if (index < 1) {
      return;
    }
    const item = this._entries[index];
    this._entries.splice(index, 1);
    this._entries.splice(index - 1, 0, item);
    this.form.markAsDirty();
  }

  public moveEntryDown(index: number): void {
    if (index + 1 >= this._entries.length) {
      return;
    }
    const item = this._entries[index];
    this._entries.splice(index, 1);
    this._entries.splice(index + 1, 0, item);
    this.form.markAsDirty();
  }

  public removeEntry(index: number): void {
    this._entries.splice(index, 1);
    this.count.setValue(this._entries.length);
    if (!this._entries.length) {
      this.detailWork = undefined;
    }
    this.form.markAsDirty();
  }

  public viewEntryDetails(entry: WorkListEntry): void {
    this.viewDetails(entry.id, entry.payload === 'c');
  }

  public editEntry(entry: WorkListEntry): void {
    this.edit(entry.id, entry.payload === 'c');
  }
  //#endregion

  public addWork(container: boolean): void {
    this.edit(null, container);
  }

  /**
   * Edit the specified work from the browser.
   */
  public editWork(work: WorkInfo): void {
    this.edit(work.id, work.isContainer);
  }

  public deleteWork(work: WorkInfo): void {
    this._dialogService
      .confirm('Confirmation', 'Delete work from database?')
      .pipe(take(1))
      .subscribe((yes) => {
        this.deletingWork = true;
        if (yes) {
          this._biblioService
            .deleteWork(work.id)
            .pipe(take(1))
            .subscribe((_) => {
              this.deletingWork = false;
              // signal browser to refresh itself
              this.browserSignals$.next('refresh');

              // remove the entry from list if it was deleted
              const index = this._entries.findIndex((e) => e.id === work.id);
              if (index > -1) {
                this._entries.splice(index, 1);
                this.count.setValue(this._entries.length);
                this.form.markAsDirty();
              }
            });
        }
      });
  }

  /**
   * Save the edited work.
   * @param work The work to be saved.
   */
  public onWorkChange(work: EditedWork): void {
    // save
    this.savingWork = true;
    this._biblioService.addWork(work).subscribe((w) => {
      // signal browser to refresh itself
      this.browserSignals$.next('refresh');

      // refresh the entry in list if it was edited
      const index = this._entries.findIndex((e) => e.id === work.id);
      if (index > -1) {
        const entry = {
          id: w.id || '',
          label: this.workToString(w),
          payload: work.isContainer ? 'c' : undefined,
        };
        this._entries.splice(index, 1, entry);
        this.form.markAsDirty();
      }
      this.savingWork = false;
    });
  }

  /**
   * Close the work being edited without saving.
   */
  public onEditorClose(): void {
    this.editedWork = undefined;
  }

  /**
   * Add the specified work to the list of entries.
   * @param work The work to add.
   */
  public pickWork(work: WorkInfo): void {
    if (this._entries.find((w) => w.id === work.id)) {
      return;
    }
    this._entries.push({
      id: work.id,
      label: this._utilService.workInfoToString(work),
      payload: work.isContainer ? 'c' : undefined,
    });
  }
}
