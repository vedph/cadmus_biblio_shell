import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  UntypedFormGroup,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

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
  EditedObject,
  ModelEditorComponentBase,
  CloseSaveButtonsComponent,
} from '@myrmidon/cadmus-ui';
import { ThesauriSet, ThesaurusEntry } from '@myrmidon/cadmus-core';

import { NgxToolsValidators } from '@myrmidon/ngx-tools';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';

import { WorkListEntry } from '@myrmidon/cadmus-biblio-core';

import {
  ExtBibliographyPart,
  EXT_BIBLIOGRAPHY_PART_TYPEID,
} from '../ext-bibliography-part';
import { WorkListComponent } from '@myrmidon/cadmus-biblio-ui';

/**
 * ExtBibliography editor component.
 * Thesauri: ext-biblio-author-roles, ext-biblio-languages, ext-biblio-work-tags
 * (all optional).
 */
@Component({
  selector: 'biblio-ext-bibliography-part',
  templateUrl: './ext-bibliography-part.component.html',
  styleUrls: ['./ext-bibliography-part.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
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
      validators: [NgxToolsValidators.strictMinLengthValidator(1)],
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
