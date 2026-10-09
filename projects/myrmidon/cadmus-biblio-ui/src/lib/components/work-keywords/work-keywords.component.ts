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
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import {
  FormField,
  applyEach,
  form,
  maxLength,
  required,
} from '@angular/forms/signals';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
  MatExpansionPanelDescription,
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import {
  MatAutocomplete,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatOption } from '@angular/material/core';
import {
  MatFormField,
  MatLabel,
  MatHint,
  MatSuffix,
  MatError,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSelect } from '@angular/material/select';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { isImplicitSubmission } from '@myrmidon/cadmus-ui';
import { BiblioService, KeywordFilter } from '@myrmidon/cadmus-biblio-api';
import { Keyword } from '@myrmidon/cadmus-biblio-core';

interface WorkKeywordsControls {
  keywords: Keyword[];
}

/**
 * Bound keywords -> draft, sorted by language and value.
 */
function toDraft(keywords: Keyword[] | undefined): WorkKeywordsControls {
  const sorted = (keywords || []).map((k) => ({
    language: k.language || '',
    value: k.value || '',
  }));
  sorted.sort((a: Keyword, b: Keyword) => {
    if (a.language !== b.language) {
      return a.language.localeCompare(b.language);
    }
    if (a.value !== b.value) {
      return a.value.localeCompare(b.value);
    }
    return 0;
  });
  return { keywords: sorted };
}

function toKeywords(draft: WorkKeywordsControls): Keyword[] | undefined {
  const keywords = draft.keywords.map((k) => ({
    language: k.language.trim(),
    value: k.value.trim(),
  }));
  return keywords.length ? keywords : undefined;
}

@Component({
  selector: 'biblio-work-keywords',
  templateUrl: './work-keywords.component.html',
  styleUrls: ['./work-keywords.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormField,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatIcon,
    MatExpansionPanelDescription,
    MatAutocomplete,
    MatOption,
    MatFormField,
    MatLabel,
    MatInput,
    MatAutocompleteTrigger,
    MatHint,
    MatIconButton,
    MatSuffix,
    MatTooltip,
    MatSelect,
    MatError,
    AsyncPipe,
  ],
})
export class WorkKeywordsComponent {
  public readonly keywords = model<Keyword[]>();

  /**
   * The maximum count of authors to retrieve. Default=10.
   */
  public readonly limit = input<number>(10);

  /**
   * Keyword's languages thesaurus entries.
   */
  public readonly langEntries = input<ThesaurusEntry[]>();

  /**
   * Event fired when this editor is discarded.
   */
  public readonly editorClose = output();

  // rebuilt whenever the keywords change, i.e. when they are bound,
  // or when this editor saves them
  private readonly _draft = linkedSignal(() => toDraft(this.keywords()));

  public readonly form = form(this._draft, (p) => {
    applyEach(p.keywords, (k) => {
      required(k.language);
      required(k.value);
      maxLength(k.value, 50);
    });
  });

  /**
   * The keywords lookup: a separate form, which is not part of the
   * edited keywords.
   */
  private readonly _search = signal<{ lookup: Keyword | string | null }>({
    lookup: null,
  });
  public readonly search = form(this._search);

  /**
   * The summary of the edited keywords.
   */
  public readonly current = computed(() =>
    this.buildCurrent(this.form.keywords().value())
  );

  public readonly editing = signal<boolean>(false);

  public readonly keywords$: Observable<Keyword[]>;
  public readonly keyword = signal<Keyword | undefined>(undefined);

  constructor(private _biblioService: BiblioService) {
    // once the draft mirrors the bound keywords again, clear the
    // interaction state
    effect(() => {
      const draft = this._draft();
      untracked(() => {
        if (this.isDraftInSync(draft)) {
          this.form().reset();
        }
      });
    });

    // autocomplete
    this.keywords$ = toObservable(this.search.lookup().value).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value: Keyword | string | null) => {
        // cleared lookup
        if (value === null || value === undefined) {
          return of([]);
        }
        // the string comes from user typing
        if (typeof value === 'string') {
          // lookup and return results
          const filter = this.getFilter(value);
          return this._biblioService.getKeywords(filter).pipe(
            switchMap((p) => {
              return of(p.items);
            })
          );
        } else {
          // the keyword comes from results
          return of([value]);
        }
      })
    );
  }

  private isDraftInSync(draft: WorkKeywordsControls): boolean {
    return JSON.stringify(draft) === JSON.stringify(toDraft(this.keywords()));
  }

  private getFilter(filterText: string): KeywordFilter {
    const m = filterText.match('^(?:([^:]+):)?(.+)');
    return {
      pageNumber: 1,
      pageSize: this.limit(),
      language: m ? m[1] : undefined,
      value: m ? m[2] : undefined,
    };
  }

  //#region Autocomplete
  public keywordToString(keyword: Keyword): string {
    if (!keyword) {
      return '';
    }
    return `[${keyword.language}] ${keyword.value}`;
  }

  public clearKeyword(): void {
    this.keyword.set(undefined);
    this.search.lookup().value.set(null);
  }

  public pickKeyword(keyword: Keyword): void {
    this.keyword.set(keyword);
    // do not add an already present keyword
    if (
      this.form
        .keywords()
        .value()
        .some((k) => k.language === keyword.language && k.value === keyword.value)
    ) {
      return;
    }
    this.addKeyword(keyword);
  }
  //#endregion

  //#region Keywords
  public addKeyword(keyword?: Keyword): void {
    // TODO sorted
    this.form
      .keywords()
      .value.set([
        ...this.form.keywords().value(),
        { language: keyword?.language || '', value: keyword?.value || '' },
      ]);
    this.form.keywords().markAsDirty();
  }

  public removeKeyword(index: number): void {
    this.form
      .keywords()
      .value.set(this.form.keywords().value().filter((_, i) => i !== index));
    this.form.keywords().markAsDirty();
  }

  private buildCurrent(keywords: Keyword[]): string {
    const sb: string[] = [];
    for (let i = 0; i < keywords.length; i++) {
      if (i > 0) {
        sb.push('; ');
      }
      sb.push('[');
      sb.push(keywords[i].language.trim());
      sb.push('] ');
      sb.push(keywords[i].value.trim());
    }
    return sb.join('');
  }
  //#endregion

  public cancel(): void {
    this.editing.set(false);
    // discard the edits
    this._draft.set(toDraft(this.keywords()));
    this.editorClose.emit();
  }

  /**
   * Save on Enter in a text input, as the former form did
   * when its save button was enabled.
   */
  public onEnterKey(event: Event): void {
    if (!isImplicitSubmission(event)) {
      return;
    }
    event.preventDefault();
    if (this.form().dirty()) {
      this.save();
    }
  }

  public save(): void {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    this.editing.set(false);
    this.keywords.set(toKeywords(this._draft()));
  }
}
