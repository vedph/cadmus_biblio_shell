import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormBuilder, Validators } from '@angular/forms';

import { ModelEditorComponentBase } from '@myrmidon/cadmus-ui';
import { AuthService } from '@myrmidon/cadmus-api';
import { ThesaurusEntry, deepCopy } from '@myrmidon/cadmus-core';

import {
  ExtBibliographyPart,
  EXT_BIBLIOGRAPHY_PART_TYPEID,
} from '../ext-bibliography-part';
import { WorkListEntry } from '@myrmidon/cadmus-biblio-core';

/**
 * ExtBibliography editor component.
 * Thesauri: ext-biblio-author-roles, ext-biblio-languages, ext-biblio-work-tags
 * (all optional).
 */
@Component({
  selector: 'biblio-ext-bibliography-part',
  templateUrl: './ext-bibliography-part.component.html',
  styleUrls: ['./ext-bibliography-part.component.css'],
})
export class ExtBibliographyPartComponent
  extends ModelEditorComponentBase<ExtBibliographyPart>
  implements OnInit {
  public works: FormControl;
  public count: FormControl;

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

  constructor(authService: AuthService, formBuilder: FormBuilder) {
    super(authService);
    // form
    this.count = formBuilder.control(0, Validators.min(1));
    this.works = formBuilder.control([]);
    this.form = formBuilder.group({
      count: this.count,
      works: this.works,
    });
  }

  public ngOnInit(): void {
    this.initEditor();
  }

  private updateForm(model: ExtBibliographyPart): void {
    if (!model) {
      this.form.reset();
      return;
    }
    this.works.setValue(model.entries || []);
    this.count.setValue(model.entries?.length || 0);
    this.form.markAsPristine();
  }

  protected onModelSet(model: ExtBibliographyPart): void {
    this.updateForm(deepCopy(model));
  }

  protected onThesauriSet(): void {
    let key = 'ext-biblio-author-roles';
    if (this.thesauri && this.thesauri[key]) {
      this.roleEntries = this.thesauri[key].entries;
    } else {
      this.roleEntries = undefined;
    }

    key = 'ext-biblio-languages';
    if (this.thesauri && this.thesauri[key]) {
      this.langEntries = this.thesauri[key].entries;
    } else {
      this.langEntries = undefined;
    }

    key = 'ext-biblio-work-tags';
    if (this.thesauri && this.thesauri[key]) {
      this.workTagEntries = this.thesauri[key].entries;
    } else {
      this.workTagEntries = undefined;
    }
  }

  protected getModelFromForm(): ExtBibliographyPart {
    let part = this.model;
    if (!part) {
      part = {
        itemId: this.itemId,
        id: '',
        typeId: EXT_BIBLIOGRAPHY_PART_TYPEID,
        roleId: this.roleId,
        timeCreated: new Date(),
        creatorId: '',
        timeModified: new Date(),
        userId: '',
        entries: [],
      };
    }
    part.entries = this.works.value;
    return part;
  }

  public onEntriesChange(entries: WorkListEntry[]): void {
    this.works.setValue(entries || []);
    this.form.markAsDirty();
  }
}
