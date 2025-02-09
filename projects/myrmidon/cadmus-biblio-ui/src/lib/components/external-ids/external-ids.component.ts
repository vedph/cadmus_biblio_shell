import {
  Component,
  effect,
  input,
  model,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
} from '@angular/material/expansion';

import { ExternalId } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { ExternalIdComponent } from '../external-id/external-id.component';

@Component({
  selector: 'biblio-external-ids',
  templateUrl: './external-ids.component.html',
  styleUrls: ['./external-ids.component.css'],
  imports: [
    MatButton,
    MatIcon,
    MatIconButton,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    ExternalIdComponent,
  ],
})
export class ExternalIdsComponent implements OnInit, OnDestroy {
  private _sub?: Subscription;
  private _dropNextInput?: boolean;

  public readonly ids = model<ExternalId[]>();

  // ext-biblio-link-scopes
  public readonly scopeEntries = input<ThesaurusEntry[]>();

  public editedId?: ExternalId;
  public editedIndex: number;

  public ctlIds: FormControl<ExternalId[]>;
  public form: FormGroup;

  constructor(formBuilder: FormBuilder) {
    this.editedIndex = -1;
    // form
    this.ctlIds = formBuilder.control([], { nonNullable: true });
    this.form = formBuilder.group({
      ctlIds: this.ctlIds,
    });

    effect(() => {
      if (this._dropNextInput) {
        this._dropNextInput = false;
        return;
      }
      this.updateForm(this.ids() || []);
    });
  }

  public ngOnInit(): void {
    this._sub = this.ctlIds.valueChanges.subscribe((_) => {
      this._dropNextInput = true;
      this.ids.set(this.ctlIds.value);
    });
  }

  public ngOnDestroy(): void {
    this._sub?.unsubscribe();
  }

  private updateForm(ids: ExternalId[]): void {
    this.ctlIds.setValue(ids);
    this.form.markAsPristine();
  }

  public editId(id: ExternalId, index: number): void {
    this.editedId = id;
    this.editedIndex = index;
  }

  public addId(): void {
    this.editId(
      {
        sourceId: '',
        scope: '',
        value: '',
      },
      -1
    );
  }

  public closeId(): void {
    this.editedId = undefined;
    this.editedIndex = -1;
  }

  public saveId(id: ExternalId): void {
    const ids = [...this.ctlIds.value];
    if (this.editedIndex === -1) {
      ids.push(id);
    } else {
      ids[this.editedIndex] = id;
    }
    this.ctlIds.setValue(ids);
    this.ctlIds.updateValueAndValidity();
    this.ctlIds.markAsDirty();
    this.closeId();
  }

  public deleteId(index: number): void {
    if (this.editedIndex === index) {
      this.closeId();
    }
    const ids = [...this.ctlIds.value];
    ids.splice(this.editedIndex, 1);
    this.ctlIds.setValue(ids);
    this.ctlIds.updateValueAndValidity();
    this.form.markAsDirty();
  }
}
