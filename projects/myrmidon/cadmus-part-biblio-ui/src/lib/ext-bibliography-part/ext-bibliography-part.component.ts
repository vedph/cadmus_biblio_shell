import {
  ChangeDetectionStrategy,
  Component,
  computed,
  linkedSignal,
} from '@angular/core';

import { MatIcon } from '@angular/material/icon';
import {
  MatCard,
  MatCardHeader,
  MatCardAvatar,
  MatCardTitle,
  MatCardContent,
  MatCardActions,
} from '@angular/material/card';

import {
  ModelEditorComponentBase,
  CloseSaveButtonsComponent,
  copyFormValue,
  setFieldFromChild,
} from '@myrmidon/cadmus-ui';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { NgxToolsSignalValidators } from '@myrmidon/ngx-tools';

import { WorkListEntry } from '@myrmidon/cadmus-biblio-core';
import { WorkListComponent } from '@myrmidon/cadmus-biblio-ui';

import {
  ExtBibliographyPart,
  EXT_BIBLIOGRAPHY_PART_TYPEID,
} from '../ext-bibliography-part';

/**
 * The editable draft behind the form.
 */
interface ExtBibliographyPartControls {
  works: WorkListEntry[];
}

/**
 * Part -> draft. The entries are copied, as the form tags the objects
 * in its arrays.
 */
function toDraft(
  part?: ExtBibliographyPart | null
): ExtBibliographyPartControls {
  return { works: copyFormValue(part?.entries || []) };
}

/**
 * ExtBibliography editor component.
 * Thesauri: ext-biblio-author-roles, ext-biblio-languages, ext-biblio-work-tags,
 * ext-biblio-link-scopes (all optional).
 */
@Component({
  selector: 'biblio-ext-bibliography-part',
  templateUrl: './ext-bibliography-part.component.html',
  styleUrls: ['./ext-bibliography-part.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardAvatar,
    MatIcon,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    CloseSaveButtonsComponent,
    WorkListComponent,
  ],
})
export class ExtBibliographyPartComponent extends ModelEditorComponentBase<ExtBibliographyPart> {
  /**
   * Authors roles entries.
   */
  public readonly roleEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['ext-biblio-author-roles']?.entries
  );
  /**
   * Keywords language entries.
   */
  public readonly langEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['ext-biblio-languages']?.entries
  );
  /**
   * Selected works tags entries.
   */
  public readonly workTagEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['ext-biblio-work-tags']?.entries
  );
  /**
   * Work links scopes entries.
   */
  public readonly scopeEntries = computed<ThesaurusEntry[] | undefined>(
    () => this.data()?.thesauri?.['ext-biblio-link-scopes']?.entries
  );

  // the draft is rebuilt from each new data
  private readonly _draft = linkedSignal(() => toDraft(this.data()?.value));
  public readonly form = this.createForm(this._draft, (p) => {
    // at least 1 entry
    NgxToolsSignalValidators.strictMinLength(p.works, 1);
  });

  constructor() {
    super();
  }

  protected getValue(): ExtBibliographyPart {
    const part = this.getEditedPart(
      EXT_BIBLIOGRAPHY_PART_TYPEID
    ) as ExtBibliographyPart;
    part.entries = copyFormValue(this._draft().works);
    return part;
  }

  // the works list autosaves its entries: setFieldFromChild ignores the
  // values equal to the field's, so that just loading the part does not
  // make it dirty
  public onEntriesChange(entries: WorkListEntry[] | undefined): void {
    setFieldFromChild(this.form.works, copyFormValue(entries || []));
  }
}
