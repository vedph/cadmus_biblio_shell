import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  UntypedFormGroup,
  FormGroup,
} from '@angular/forms';

import { EditedObject, ModelEditorComponentBase } from '@myrmidon/cadmus-ui';
import { ThesauriSet, ThesaurusEntry } from '@myrmidon/cadmus-core';

import { WorkListEntry } from '@myrmidon/cadmus-biblio-core';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';

import {
  ExtBibliographyPart,
  EXT_BIBLIOGRAPHY_PART_TYPEID,
} from '../ext-bibliography-part';
import { NgToolsValidators } from '@myrmidon/ng-tools';

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
  implements OnInit
{
  public works: FormControl<WorkListEntry[]>;
  public initialWorks: WorkListEntry[];

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
  // biblio-link-scopes
  @Input()
  public scopeEntries: ThesaurusEntry[] | undefined;

  constructor(authService: AuthJwtService, formBuilder: FormBuilder) {
    super(authService, formBuilder);
    this.initialWorks = [];
    // form
    this.works = formBuilder.control([], {
      validators: [NgToolsValidators.strictMinLengthValidator(1)],
      nonNullable: true,
    });
  }

  public override ngOnInit(): void {
    super.ngOnInit();
  }

  protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
    return formBuilder.group({
      works: this.works,
    });
  }

  private updateThesauri(thesauri: ThesauriSet): void {
    let key = 'ext-biblio-author-roles';
    if (this.hasThesaurus(key)) {
      this.roleEntries = thesauri[key].entries;
    } else {
      this.roleEntries = undefined;
    }

    key = 'ext-biblio-languages';
    if (this.hasThesaurus(key)) {
      this.langEntries = thesauri[key].entries;
    } else {
      this.langEntries = undefined;
    }

    key = 'ext-biblio-work-tags';
    if (this.hasThesaurus(key)) {
      this.workTagEntries = thesauri[key].entries;
    } else {
      this.workTagEntries = undefined;
    }

    key = 'ext-biblio-link-scopes';
    if (this.hasThesaurus(key)) {
      this.scopeEntries = thesauri[key].entries;
    } else {
      this.scopeEntries = undefined;
    }
  }

  private updateForm(part?: ExtBibliographyPart | null): void {
    if (!part) {
      this.form.reset();
      return;
    }
    this.works.setValue(part.entries || []);
    this.initialWorks = part.entries || [];
    this.form.markAsPristine();
  }

  protected override onDataSet(data?: EditedObject<ExtBibliographyPart>): void {
    // thesauri
    if (data?.thesauri) {
      this.updateThesauri(data.thesauri);
    }

    // form
    this.updateForm(data?.value);
  }

  protected getValue(): ExtBibliographyPart {
    let part = this.getEditedPart(
      EXT_BIBLIOGRAPHY_PART_TYPEID
    ) as ExtBibliographyPart;
    part.entries = this.works.value;
    return part;
  }

  public onEntriesChange(entries: WorkListEntry[]): void {
    this.works.setValue(entries || []);
    this.works.updateValueAndValidity();
    this.works.markAsDirty();
    this.form.markAsDirty();
  }
}
