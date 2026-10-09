import {
  Component,
  computed,
  effect,
  input,
  linkedSignal,
  model,
  output,
  ChangeDetectionStrategy,
  untracked,
} from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';

import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

import { ExternalId } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { isImplicitSubmission } from '@myrmidon/cadmus-ui';

interface ExternalIdControls {
  scope: string;
  value: string;
}

/**
 * Bound ID -> draft. A missing scope gets the default scope, if any.
 */
function toDraft(
  id: ExternalId | undefined,
  defaultScope: string
): ExternalIdControls {
  return {
    scope: id?.scope || defaultScope,
    value: id?.value || '',
  };
}

/**
 * Work/container external identifier editor.
 */
@Component({
  selector: 'biblio-external-id',
  templateUrl: './external-id.component.html',
  styleUrls: ['./external-id.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormField,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatError,
    MatInput,
    MatIconButton,
    MatTooltip,
    MatIcon,
  ],
})
export class ExternalIdComponent {
  public readonly id = model<ExternalId>();

  // ext-biblio-link-scopes
  public readonly scopeEntries = input<ThesaurusEntry[]>();

  public readonly close = output();

  /**
   * The scope used for an ID without scope: the first scope entry if any.
   */
  private readonly _defaultScope = computed(
    () => this.scopeEntries()?.[0]?.id || ''
  );

  // rebuilt only when the ID changes: changes to the scope entries
  // must not reset the user's edits
  private readonly _draft = linkedSignal(() =>
    toDraft(
      this.id(),
      untracked(() => this._defaultScope())
    )
  );

  public readonly form = form(this._draft, (p) => {
    required(p.scope);
    maxLength(p.scope, 50);
    required(p.value);
    maxLength(p.value, 1000);
  });

  /**
   * True when the edited ID can be saved, i.e. it is valid and changed.
   */
  public readonly canSave = computed(
    () => this.form().valid() && this.form().dirty()
  );

  constructor() {
    // once the draft mirrors the bound ID again, clear the interaction state
    effect(() => {
      const draft = this._draft();
      untracked(() => {
        if (this.isDraftInSync(draft)) {
          this.form().reset();
        }
      });
    });
  }

  private isDraftInSync(draft: ExternalIdControls): boolean {
    const bound = toDraft(this.id(), this._defaultScope());
    return draft.scope === bound.scope && draft.value === bound.value;
  }

  private getId(): ExternalId {
    const draft = this._draft();
    return {
      sourceId: this.id()?.sourceId || '',
      scope: draft.scope.trim(),
      value: draft.value.trim(),
    };
  }

  public cancel(): void {
    this.close.emit();
  }

  /**
   * Save on Enter in a text input, as the former form did.
   */
  public onEnterKey(event: Event): void {
    if (!isImplicitSubmission(event)) {
      return;
    }
    event.preventDefault();
    if (this.canSave()) {
      this.save();
    }
  }

  public save(): void {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    this.id.set(this.getId());
  }
}
