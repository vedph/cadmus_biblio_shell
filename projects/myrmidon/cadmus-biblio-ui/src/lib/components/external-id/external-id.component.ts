import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ExternalId } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

/**
 * Work/container external identifier editor.
 */
@Component({
  selector: 'biblio-external-id',
  templateUrl: './external-id.component.html',
  styleUrls: ['./external-id.component.css'],
  standalone: false,
})
export class ExternalIdComponent implements OnInit {
  private _id: ExternalId | undefined;

  @Input()
  public get id(): ExternalId | undefined | null {
    return this._id;
  }
  public set id(value: ExternalId | undefined | null) {
    if (this._id === value) {
      return;
    }
    this._id = value || undefined;
    this.updateForm(this._id);
  }

  // ext-biblio-link-scopes
  @Input()
  public scopeEntries: ThesaurusEntry[] | undefined;

  @Output()
  public idChange: EventEmitter<ExternalId>;

  @Output()
  public close: EventEmitter<any>;

  public scope: FormControl<string>;
  public value: FormControl<string>;
  public form: FormGroup;

  constructor(formBuilder: FormBuilder) {
    // form
    this.scope = formBuilder.control('', {
      validators: [Validators.required, Validators.maxLength(50)],
      nonNullable: true,
    });
    this.value = formBuilder.control('', {
      validators: [Validators.required, Validators.maxLength(1000)],
      nonNullable: true,
    });
    this.form = formBuilder.group({
      scope: this.scope,
      value: this.value,
    });
    // events
    this.idChange = new EventEmitter<ExternalId>();
    this.close = new EventEmitter<any>();
  }

  public ngOnInit(): void {
    if (this.scopeEntries?.length && !this.scope.value) {
      this.scope.setValue(this.scopeEntries[0].id);
    }
  }

  private updateForm(id: ExternalId | undefined): void {
    if (!id) {
      this.form.reset();
      return;
    }
    this.scope.setValue(id.scope);
    this.value.setValue(id.value);
    this.form.markAsPristine();
  }

  private getId(): ExternalId {
    return {
      sourceId: this._id?.sourceId || '',
      scope: this.scope.value?.trim(),
      value: this.value.value?.trim(),
    };
  }

  public cancel(): void {
    this.close.emit();
  }

  public save(): void {
    if (!this.form.valid) {
      return;
    }
    this._id = this.getId();
    this.idChange.emit(this._id);
  }
}
