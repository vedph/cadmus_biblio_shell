import {
  Component,
  input,
  model,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';

import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
} from '@angular/material/expansion';

import { ExternalId } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { ExternalIdComponent } from '../external-id/external-id.component';

/**
 * External IDs editor. Each change made by the user (add, edit, delete)
 * is immediately saved into the IDs model.
 */
@Component({
  selector: 'biblio-external-ids',
  templateUrl: './external-ids.component.html',
  styleUrls: ['./external-ids.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatButton,
    MatIcon,
    MatIconButton,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatTooltip,
    ExternalIdComponent,
  ],
})
export class ExternalIdsComponent {
  public readonly ids = model<ExternalId[]>();

  // ext-biblio-link-scopes
  public readonly scopeEntries = input<ThesaurusEntry[]>();

  public readonly editedId = signal<ExternalId | undefined>(undefined);
  public readonly editedIndex = signal<number>(-1);

  public editId(id: ExternalId, index: number): void {
    this.editedId.set(id);
    this.editedIndex.set(index);
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
    this.editedId.set(undefined);
    this.editedIndex.set(-1);
  }

  public saveId(id: ExternalId): void {
    const ids = [...(this.ids() || [])];
    if (this.editedIndex() === -1) {
      ids.push(id);
    } else {
      ids[this.editedIndex()] = id;
    }
    this.ids.set(ids);
    this.closeId();
  }

  public deleteId(index: number): void {
    if (this.editedIndex() === index) {
      this.closeId();
    } else if (this.editedIndex() > index) {
      this.editedIndex.update((i) => i - 1);
    }
    const ids = [...(this.ids() || [])];
    ids.splice(index, 1);
    this.ids.set(ids);
  }
}
