import {
  Component,
  computed,
  effect,
  input,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormField,
  applyEach,
  form,
  maxLength,
  required,
} from '@angular/forms/signals';

import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
  MatExpansionPanelDescription,
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { RefLookupComponent } from '@myrmidon/cadmus-refs-lookup';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';

import { NgxToolsSignalValidators } from '@myrmidon/ngx-tools';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { isImplicitSubmission } from '@myrmidon/cadmus-ui';
import { Author, WorkAuthor } from '@myrmidon/cadmus-biblio-core';

import { AuthorRefLookupService } from '../../services/author-ref-lookup.service';

/**
 * An author being edited.
 */
interface WorkAuthorRow {
  id: string;
  last: string;
  first: string;
  suffix: string;
  role: string;
}

interface WorkAuthorsControls {
  authors: WorkAuthorRow[];
}

function toRow(author?: WorkAuthor): WorkAuthorRow {
  return {
    id: author?.id || '',
    last: author?.last || '',
    first: author?.first || '',
    suffix: author?.suffix || '',
    role: author?.role || '',
  };
}

/**
 * Bound authors -> draft. The authors are sorted by their ordinals if any;
 * otherwise, they keep the received order.
 */
function toDraft(authors: WorkAuthor[] | undefined): WorkAuthorsControls {
  const sorted = [...(authors || [])];
  sorted.sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0));
  return { authors: sorted.map((a) => toRow(a)) };
}

/**
 * Draft -> authors, numbered by their position.
 */
function toAuthors(draft: WorkAuthorsControls): WorkAuthor[] | undefined {
  const authors: WorkAuthor[] = draft.authors.map((r, i) => ({
    id: r.id || undefined,
    last: r.last.trim(),
    first: r.first.trim(),
    suffix: r.suffix.trim() || undefined,
    role: r.role.trim() || undefined,
    ordinal: i + 1,
  }));
  return authors.length ? authors : undefined;
}

/**
 * Work's authors editor. This lets users pick any author by
 * typing some letters of his last name, adding it to the set
 * of authors assigned to a work.
 */
@Component({
  selector: 'biblio-work-authors',
  templateUrl: './work-authors.component.html',
  styleUrls: ['./work-authors.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormField,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatIcon,
    MatExpansionPanelDescription,
    RefLookupComponent,
    MatButton,
    MatTooltip,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatSelect,
    MatOption,
  ],
})
export class WorkAuthorsComponent {
  public readonly authors = model<WorkAuthor[]>();

  /**
   * Author's roles thesaurus entries. When set, there
   * should be an entry with value='-' for the null role.
   */
  public readonly roleEntries = input<ThesaurusEntry[]>();

  /**
   * Event fired when this editor is discarded.
   */
  public readonly editorClose = output();

  // rebuilt whenever the authors change, i.e. when they are bound,
  // or when this editor saves them
  private readonly _draft = linkedSignal(() => toDraft(this.authors()));

  public readonly form = form(this._draft, (p) => {
    // at least 1 author
    NgxToolsSignalValidators.strictMinLength(p.authors, 1);
    applyEach(p.authors, (a) => {
      required(a.last);
      maxLength(a.last, 50);
      required(a.first);
      maxLength(a.first, 50);
      maxLength(a.suffix, 50);
      maxLength(a.role, 50);
    });
  });

  /**
   * The summary of the edited authors.
   */
  public readonly currentAuthors = computed(() =>
    this.buildCurrentAuthors(this.form.authors().value())
  );

  public readonly editing = signal<boolean>(false);

  public readonly author = signal<WorkAuthor | undefined>(undefined);

  constructor(public authorLookupService: AuthorRefLookupService) {
    // once the draft mirrors the bound authors again, clear the
    // interaction state
    effect(() => {
      const draft = this._draft();
      untracked(() => {
        if (this.isDraftInSync(draft)) {
          this.form().reset();
        }
      });
    });
  }

  private isDraftInSync(draft: WorkAuthorsControls): boolean {
    return JSON.stringify(draft) === JSON.stringify(toDraft(this.authors()));
  }

  /**
   * Set the edited authors as the result of a user action.
   */
  private setAuthors(authors: WorkAuthorRow[]): void {
    this.form.authors().value.set(authors);
    this.form.authors().markAsDirty();
  }

  //#region Authors
  public pickAuthor(author: unknown): void {
    this.author.set(author as Author);
    const wa: WorkAuthor = {
      ...(author as Author),
      ordinal: this.form.authors().value().length + 1,
    };
    this.addAuthor(wa);
    setTimeout(() => {
      this.author.set(undefined);
    });
  }

  public addAuthor(item?: WorkAuthor): void {
    const authors = this.form.authors().value();
    // do not add an already existing author
    if (item && authors.some((a) => a.id === item.id)) {
      return;
    }
    this.setAuthors([...authors, toRow(item)]);
  }

  public removeAuthor(index: number): void {
    this.setAuthors(this.form.authors().value().filter((_, i) => i !== index));
  }

  public moveAuthorUp(index: number): void {
    if (index < 1) {
      return;
    }
    const authors = [...this.form.authors().value()];
    const author = authors[index];
    authors.splice(index, 1);
    authors.splice(index - 1, 0, author);
    this.setAuthors(authors);
  }

  public moveAuthorDown(index: number): void {
    const authors = [...this.form.authors().value()];
    if (index + 1 >= authors.length) {
      return;
    }
    const author = authors[index];
    authors.splice(index, 1);
    authors.splice(index + 1, 0, author);
    this.setAuthors(authors);
  }

  private buildCurrentAuthors(authors: WorkAuthorRow[]): string {
    const sb: string[] = [];
    for (let i = 0; i < authors.length; i++) {
      const a = authors[i];
      if (i > 0) {
        sb.push('; ');
      }
      // last
      sb.push(a.last.trim());
      // , first
      const first = a.first.trim();
      if (first) {
        sb.push(', ');
        sb.push(first);
      }
      // (role)
      const role = a.role.trim();
      if (role) {
        sb.push(' (');
        sb.push(role);
        sb.push(')');
      }
    }
    return sb.join('');
  }
  //#endregion

  public cancel(): void {
    this.editing.set(false);
    // discard the edits
    this._draft.set(toDraft(this.authors()));
    this.editorClose.emit();
  }

  /**
   * Save on Enter in a text input, as the former form did.
   */
  public onEnterKey(event: Event): void {
    if (!isImplicitSubmission(event)) {
      return;
    }
    event.preventDefault();
    this.save();
  }

  public save(): void {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    this.editing.set(false);
    this.authors.set(toAuthors(this._draft()));
  }
}
