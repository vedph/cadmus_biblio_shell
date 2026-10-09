import { inputBinding, outputBinding, signal } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { ViewportScroller } from '@angular/common';
import { provideNativeDateAdapter } from '@angular/material/core';
import { render, screen, within } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';
import { BehaviorSubject, delay, Observable, of } from 'rxjs';

import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { Work, WorkListEntry } from '@myrmidon/cadmus-biblio-core';
import { EditedObject, ThesauriSet } from '@myrmidon/cadmus-core';
import { AppRepository } from '@myrmidon/cadmus-state';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { LocalStorageService } from '@myrmidon/ngx-tools';

import {
  EXT_BIBLIOGRAPHY_PART_TYPEID,
  ExtBibliographyPart,
} from '../ext-bibliography-part';
import { ExtBibliographyPartComponent } from './ext-bibliography-part.component';

const ENTRIES: WorkListEntry[] = [
  { id: 'w1', label: 'Doe - Alpha, 2000', tag: 'pri' },
  { id: 'w2', label: 'Roe - Beta, 2010' },
];

const PART: ExtBibliographyPart = {
  id: 'p1',
  itemId: 'i1',
  typeId: EXT_BIBLIOGRAPHY_PART_TYPEID,
  timeCreated: new Date(2024, 0, 1),
  creatorId: 'zeus',
  timeModified: new Date(2024, 0, 1),
  userId: 'zeus',
  entries: ENTRIES,
};

const THESAURI: ThesauriSet = {
  'ext-biblio-work-tags': {
    id: 'ext-biblio-work-tags@en',
    language: 'en',
    entries: [
      { id: 'pri', value: 'primary' },
      { id: 'sec', value: 'secondary' },
    ],
  },
  'ext-biblio-link-scopes': {
    id: 'ext-biblio-link-scopes@en',
    language: 'en',
    entries: [
      { id: 'doi', value: 'DOI' },
      { id: 'isbn', value: 'ISBN' },
    ],
  },
};

const WORK: Work = {
  id: 'w1',
  key: 'Doe 2000',
  type: 'book',
  title: 'Alpha',
  language: 'eng',
  yearPub: 2000,
};

/** Async observable, like HTTP responses. */
function later<T>(value: T): Observable<T> {
  return of(value).pipe(delay(0));
}

/** Let pending async rendering complete. */
async function settle(fixture: ComponentFixture<unknown>) {
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r, 10));
  await fixture.whenStable();
}

async function setup(
  options: {
    data?: EditedObject<ExtBibliographyPart>;
    roles?: string[];
  } = {}
) {
  const user = { userName: 'zeus', roles: options.roles ?? ['editor'] };
  const auth = {
    currentUserValue: user,
    currentUser$: new BehaviorSubject(user),
  };
  const biblio = {
    getWorks: vi.fn(() =>
      later({ pageNumber: 1, pageSize: 10, total: 0, items: [] })
    ),
    getContainers: vi.fn(() =>
      later({ pageNumber: 1, pageSize: 10, total: 0, items: [] })
    ),
    getWorkTypes: vi.fn(() =>
      later({ pageNumber: 1, pageSize: 0, total: 0, items: [] })
    ),
    getWork: vi.fn(() => later(WORK)),
    addWork: vi.fn((w: Work) => later(w)),
  };
  const dataChange = vi.fn();
  const editorClose = vi.fn();
  const dataInput = signal(options.data);
  const result = await render(ExtBibliographyPartComponent, {
    bindings: [
      inputBinding('data', dataInput),
      outputBinding('dataChange', dataChange),
      outputBinding('editorClose', editorClose),
    ],
    providers: [
      { provide: AuthJwtService, useValue: auth },
      {
        provide: AppRepository,
        useValue: { getTypeThesaurus: () => undefined },
      },
      { provide: BiblioService, useValue: biblio },
      { provide: DialogService, useValue: { confirm: () => later(true) } },
      {
        provide: LocalStorageService,
        useValue: { retrieve: () => null, store: vi.fn() },
      },
      { provide: ViewportScroller, useValue: { scrollToAnchor: vi.fn() } },
      provideNativeDateAdapter(),
    ],
  });
  await settle(result.fixture);
  return {
    ...result,
    biblio,
    dataInput,
    dataChange,
    editorClose,
    user: userEvent.setup(),
  };
}

function saveButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: /save/ });
}

/** Buttons of the entries list (not of the browser's table). */
function entryButtons(description: string): HTMLElement[] {
  return screen
    .queryAllByRole('button', { description })
    .filter((b) => !b.closest('table'));
}

describe('ExtBibliographyPartComponent', () => {
  it('should render a new part which cannot be saved without entries', async () => {
    await setup();
    expect(
      screen.getByText('External Bibliography Part')
    ).toBeInTheDocument();
    expect(entryButtons('View work').length).toBe(0);
    expect(saveButton()).toBeDisabled();
  });

  it('should show the part entries', async () => {
    await setup({ data: { value: PART, thesauri: {} } });
    expect(screen.getByText(/Doe - Alpha, 2000/)).toBeInTheDocument();
    expect(screen.getByText(/Roe - Beta, 2010/)).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
  });

  it('should save the edited entries', async () => {
    const { user, dataChange, fixture } = await setup({
      data: { value: PART, thesauri: {} },
    });
    await user.click(entryButtons('Remove this work from list')[0]);
    await settle(fixture);
    await user.click(saveButton());
    expect(dataChange).toHaveBeenCalledTimes(1);
    const saved = dataChange.mock.calls[0][0] as EditedObject<ExtBibliographyPart>;
    expect(saved.value).toEqual(
      expect.objectContaining({
        id: 'p1',
        itemId: 'i1',
        typeId: EXT_BIBLIOGRAPHY_PART_TYPEID,
        entries: [ENTRIES[1]],
      })
    );
  });

  it('should not allow saving to users below operator level', async () => {
    await setup({ data: { value: PART, thesauri: {} }, roles: ['visitor'] });
    expect(screen.queryByRole('button', { name: /save/ })).not.toBeInTheDocument();
  });

  it('should emit close', async () => {
    const { user, editorClose } = await setup({
      data: { value: PART, thesauri: {} },
    });
    await user.click(screen.getByRole('button', { name: /close/ }));
    expect(editorClose).toHaveBeenCalled();
  });

  it('should pass thesauri to the works list', async () => {
    const { user } = await setup({ data: { value: PART, thesauri: THESAURI } });
    // work tags
    const tags = screen.getAllByRole('combobox', { name: 'tag' });
    await vi.waitFor(() => expect(tags[0]).toHaveTextContent('primary'));

    // link scopes, in the work editor
    await user.click(entryButtons('Edit this work')[0]);
    const editor = within(
      await screen.findByRole('region', { name: 'Alpha' })
    );
    const links = editor.getByRole('group', { name: 'links' });
    await user.click(within(links).getByRole('button', { name: /ID/ }));
    expect(
      within(links).getByRole('combobox', { name: 'scope' })
    ).toHaveTextContent('DOI');
  });

  it('should not save the part when saving a work in the list', async () => {
    const { user, biblio, dataChange } = await setup({
      data: { value: PART, thesauri: {} },
    });
    await user.click(entryButtons('Edit this work')[0]);
    const editor = within(
      await screen.findByRole('region', { name: 'Alpha' })
    );
    await user.type(editor.getByRole('textbox', { name: 'note' }), 'x');
    await user.click(
      editor.getByRole('button', { description: 'Accept work changes' })
    );
    expect(biblio.addWork).toHaveBeenCalled();
    expect(dataChange).not.toHaveBeenCalled();
  });

  it('should reload when data change', async () => {
    const { dataInput, fixture } = await setup({
      data: { value: PART, thesauri: {} },
    });
    dataInput.set({ value: { ...PART, entries: [ENTRIES[1]] }, thesauri: {} });
    await settle(fixture);
    expect(screen.queryByText(/Doe - Alpha, 2000/)).not.toBeInTheDocument();
    expect(screen.getByText(/Roe - Beta, 2010/)).toBeInTheDocument();
  });
});
