import { inputBinding, outputBinding, signal } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { ViewportScroller } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { provideNativeDateAdapter } from '@angular/material/core';
import { render, screen, within } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';
import { delay, Observable, of } from 'rxjs';

import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import {
  Container,
  Work,
  WorkInfo,
  WorkListEntry,
} from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { LocalStorageService } from '@myrmidon/ngx-tools';

import { WorkListComponent } from './work-list.component';

const ENTRIES: WorkListEntry[] = [
  { id: 'w1', label: 'Doe - Alpha, 2000', tag: 't1', note: 'n1' },
  { id: 'c1', label: 'Roe - Journal, 1999', payload: 'c' },
];

const WORK: Work = {
  id: 'w1',
  key: 'Doe 2000',
  type: 'book',
  title: 'Alpha',
  language: 'eng',
  yearPub: 2000,
  authors: [{ first: 'John', last: 'Doe' }],
};
const CONTAINER: Container = {
  id: 'c1',
  key: 'Roe 1999',
  type: 'journal',
  title: 'Journal',
  language: 'eng',
  yearPub: 1999,
  authors: [{ first: 'Jane', last: 'Roe' }],
};
const BROWSED: WorkInfo[] = [
  {
    isContainer: false,
    id: 'w1',
    key: 'Doe 2000',
    authors: [{ first: 'John', last: 'Doe' }],
    type: 'book',
    title: 'Alpha',
    language: 'eng',
    edition: 1,
    yearPub: 2000,
    placePub: '',
  },
  {
    isContainer: true,
    id: 'c2',
    key: 'Poe 2010',
    authors: [{ first: 'Ed', last: 'Poe' }],
    type: 'procs',
    title: 'Proceedings',
    language: 'eng',
    edition: 1,
    yearPub: 2010,
    placePub: '',
  },
];

/** Async observable, like HTTP responses. */
function later<T>(value: T): Observable<T> {
  return of(value).pipe(delay(0));
}

/** Let pending async rendering complete. */
async function settle(fixture: ComponentFixture<unknown>, ms = 10) {
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r, ms));
  await fixture.whenStable();
}

async function setup(
  options: {
    entries?: WorkListEntry[];
    workTagEntries?: ThesaurusEntry[];
    confirm?: boolean;
    // like a parent binding the entries two-way: each emitted value comes
    // back as a new input (a copy, as from a parent's form)
    roundTrip?: boolean;
  } = {}
) {
  const biblio = {
    getWorks: vi.fn(() =>
      later({ pageNumber: 1, pageSize: 10, total: 2, items: BROWSED })
    ),
    getContainers: vi.fn(() =>
      later({ pageNumber: 1, pageSize: 10, total: 0, items: [] })
    ),
    getWorkTypes: vi.fn(() =>
      later({
        pageNumber: 1,
        pageSize: 0,
        total: 2,
        items: [
          { id: 'book', name: 'Book' },
          { id: 'journal', name: 'Journal' },
        ],
      })
    ),
    getWork: vi.fn(() => later(WORK)),
    getContainer: vi.fn(() => later(CONTAINER)),
    addWork: vi.fn((w: Work) => later({ ...w, id: w.id || 'new' })),
    addContainer: vi.fn((c: Container) => later({ ...c, id: c.id || 'new' })),
    deleteWork: vi.fn(() => later(null)),
    deleteContainer: vi.fn(() => later(null)),
  };
  const dialog = { confirm: vi.fn(() => later(options.confirm ?? true)) };
  const clipboard = { copy: vi.fn() };
  const scroller = { scrollToAnchor: vi.fn() };
  const storage = { retrieve: vi.fn(() => null), store: vi.fn() };
  const entriesInput = signal(options.entries ?? []);
  const entriesChange = vi.fn((entries: WorkListEntry[]) => {
    if (options.roundTrip) {
      entriesInput.set(structuredClone(entries));
    }
  });

  const result = await render(WorkListComponent, {
    bindings: [
      inputBinding('entries', entriesInput),
      inputBinding('workTagEntries', () => options.workTagEntries),
      outputBinding('entriesChange', entriesChange),
    ],
    providers: [
      { provide: BiblioService, useValue: biblio },
      { provide: DialogService, useValue: dialog },
      { provide: Clipboard, useValue: clipboard },
      { provide: ViewportScroller, useValue: scroller },
      { provide: LocalStorageService, useValue: storage },
      provideNativeDateAdapter(),
    ],
  });
  await settle(result.fixture);
  return {
    ...result,
    biblio,
    dialog,
    clipboard,
    scroller,
    entriesInput,
    entriesChange,
    user: userEvent.setup(),
  };
}

/** Get the work editor panel's region, named after its header. */
async function editor(name: string | RegExp) {
  return within(await screen.findByRole('region', { name }));
}

/** Buttons of the entries list (not of the browser's table). */
function entryButtons(description: string): HTMLElement[] {
  return screen
    .getAllByRole('button', { description })
    .filter((b) => !b.closest('table'));
}

function browserRows(): HTMLElement[] {
  const [, body] = within(screen.getByRole('table')).getAllByRole('rowgroup');
  return within(body).getAllByRole('row');
}

function labels(): string[] {
  return entryButtons('View work').map((b) =>
    b.parentElement!.firstChild!.textContent!.trim() +
    ' ' +
    Array.from(b.parentElement!.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent!.trim())
      .filter((s) => s)
      .slice(1)
      .join(' ')
  );
}

describe('WorkListComponent', () => {
  it('should list the entries with their tags and notes', async () => {
    await setup({ entries: ENTRIES });
    expect(screen.getByText(/Doe - Alpha, 2000/)).toBeInTheDocument();
    expect(screen.getByText(/Roe - Journal, 1999/)).toBeInTheDocument();
    expect(labels()).toEqual(['1. Doe - Alpha, 2000', '2. Roe - Journal, 1999']);
    const tags = screen.getAllByRole('textbox', { name: 'tag' });
    const notes = screen.getAllByRole('textbox', { name: 'note' });
    expect(tags.map((t) => (t as HTMLInputElement).value)).toEqual(['t1', '']);
    expect(notes.map((t) => (t as HTMLInputElement).value)).toEqual(['n1', '']);
    // the browser is loaded
    expect(browserRows()).toHaveLength(2);
  });

  it('should emit entries with edited tag and note', async () => {
    const { user, entriesChange } = await setup({ entries: ENTRIES });
    const tag = screen.getAllByRole('textbox', { name: 'tag' })[1];
    await user.type(tag, ' t2 ');
    await vi.waitFor(() =>
      expect(entriesChange).toHaveBeenLastCalledWith([
        ENTRIES[0],
        { ...ENTRIES[1], tag: 't2', note: undefined },
      ])
    );
    // the form is not rebuilt while typing
    expect(tag).toHaveFocus();
  });

  it('should limit the length of a typed tag', async () => {
    const { user } = await setup({ entries: ENTRIES });
    // the field's maxLength rule is applied to the native input
    const tag = screen.getAllByRole('textbox', { name: 'tag' })[1];
    expect(tag).toHaveAttribute('maxlength', '50');
    await user.click(tag);
    await user.paste('x'.repeat(51));
    expect(tag).toHaveValue('x'.repeat(50));
  });

  it('should show a too long tag error for a bound value', async () => {
    const { user } = await setup({
      entries: [{ ...ENTRIES[1], tag: 'x'.repeat(51) }],
    });
    await user.click(screen.getByRole('textbox', { name: 'tag' }));
    await user.tab();
    expect(await screen.findByText('tag too long')).toBeInTheDocument();
  });

  it('should use a tag select with tag entries', async () => {
    const { user, entriesChange } = await setup({
      entries: [ENTRIES[1]],
      workTagEntries: [
        { id: 'pri', value: 'primary' },
        { id: 'sec', value: 'secondary' },
      ],
    });
    await user.click(screen.getByRole('combobox', { name: 'tag' }));
    await user.click(await screen.findByRole('option', { name: 'secondary' }));
    await vi.waitFor(() =>
      expect(entriesChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ id: 'c1', tag: 'sec' }),
      ])
    );
  });

  it('should remove an entry', async () => {
    const { user, entriesChange, fixture } = await setup({ entries: ENTRIES });
    await user.click(entryButtons('Remove this work from list')[0]);
    await settle(fixture);
    expect(entriesChange).toHaveBeenLastCalledWith([ENTRIES[1]]);
    expect(labels()).toEqual(['1. Roe - Journal, 1999']);
  });

  it('should move entries keeping their tags', async () => {
    const { user, entriesChange, fixture } = await setup({ entries: ENTRIES });
    expect(entryButtons('Move work up')[0]).toBeDisabled();
    expect(entryButtons('Move work down')[1]).toBeDisabled();
    await user.click(entryButtons('Move work down')[0]);
    await settle(fixture);
    expect(entriesChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'c1' }),
      expect.objectContaining({ id: 'w1', tag: 't1', note: 'n1' }),
    ]);
    expect(labels()).toEqual(['1. Roe - Journal, 1999', '2. Doe - Alpha, 2000']);
    expect(
      screen
        .getAllByRole('textbox', { name: 'tag' })
        .map((t) => (t as HTMLInputElement).value)
    ).toEqual(['', 't1']);

    await user.click(entryButtons('Move work up')[1]);
    await settle(fixture);
    expect(labels()).toEqual(['1. Doe - Alpha, 2000', '2. Roe - Journal, 1999']);
  });

  it('should copy an entry ID', async () => {
    const { user, clipboard } = await setup({ entries: ENTRIES });
    await user.click(entryButtons("Copy work's ID")[1]);
    expect(clipboard.copy).toHaveBeenCalledWith('c1');
  });

  it('should show the details of a work and of a container', async () => {
    const { user, biblio } = await setup({ entries: ENTRIES });
    await user.click(entryButtons('View work')[0]);
    expect(biblio.getWork).toHaveBeenCalledWith('w1');
    expect(
      await screen.findByRole('button', { name: 'Doe - Alpha, 2000' })
    ).toHaveAttribute('aria-expanded', 'true');

    await user.click(entryButtons('View work')[1]);
    expect(biblio.getContainer).toHaveBeenCalledWith('c1');
    expect(
      await screen.findByRole('button', { name: 'Roe - Journal, 1999' })
    ).toBeInTheDocument();
  });

  it('should edit and save an entry work, updating its label', async () => {
    const { user, biblio, entriesChange, scroller, fixture } = await setup({
      entries: ENTRIES,
    });
    await user.click(entryButtons('Edit this work')[0]);
    const ed = await editor('Alpha');
    const title = ed.getByRole('textbox', { name: 'title' });
    expect(title).toHaveValue('Alpha');
    await vi.waitFor(() =>
      expect(scroller.scrollToAnchor).toHaveBeenCalledWith('work-editor')
    );

    await user.clear(title);
    await user.type(title, 'Beta');
    const worksBefore = biblio.getWorks.mock.calls.length;
    await user.click(
      ed.getByRole('button', { description: 'Accept work changes' })
    );
    expect(biblio.addWork).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'w1', title: 'Beta', isContainer: false })
    );
    await settle(fixture);
    // label updated, tag and note kept
    expect(entriesChange).toHaveBeenLastCalledWith([
      {
        id: 'w1',
        label: 'Doe - Beta, 2000',
        payload: undefined,
        tag: 't1',
        note: 'n1',
      },
      ENTRIES[1],
    ]);
    // browser refreshed and editor closed
    expect(biblio.getWorks.mock.calls.length).toBe(worksBefore + 1);
    expect(screen.queryByRole('region', { name: 'Beta' })).not.toBeInTheDocument();
  });

  it('should edit a container entry', async () => {
    const { user, biblio, fixture } = await setup({ entries: ENTRIES });
    await user.click(entryButtons('Edit this work')[1]);
    const ed = await editor('Journal');
    expect(ed.getByRole('textbox', { name: 'title' })).toHaveValue('Journal');
    expect(ed.getByRole('checkbox', { name: 'container' })).toBeChecked();
    await user.type(ed.getByRole('textbox', { name: 'note' }), 'x');
    await user.click(
      ed.getByRole('button', { description: 'Accept work changes' })
    );
    expect(biblio.addContainer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', isContainer: true })
    );
    await settle(fixture);
  });

  it('should close the editor without saving', async () => {
    const { user, biblio } = await setup({ entries: ENTRIES });
    await user.click(entryButtons('Edit this work')[0]);
    const ed = await editor('Alpha');
    await user.click(
      ed.getByRole('button', { description: 'Discard work changes' })
    );
    expect(screen.queryByRole('region', { name: 'Alpha' })).not.toBeInTheDocument();
    expect(biblio.addWork).not.toHaveBeenCalled();
  });

  it('should add works picked from the browser only once', async () => {
    const { user, entriesChange, fixture } = await setup({
      entries: [ENTRIES[1]],
    });
    const pick = (i: number) =>
      user.click(
        within(browserRows()[i]).getByRole('button', {
          description: 'Pick this work',
        })
      );
    await pick(1);
    await settle(fixture);
    expect(entriesChange).toHaveBeenLastCalledWith([
      ENTRIES[1],
      { id: 'c2', label: 'Poe - Proceedings, 2010', payload: 'c' },
    ]);
    expect(labels()).toEqual([
      '1. Roe - Journal, 1999',
      '2. Poe - Proceedings, 2010',
    ]);
    const calls = entriesChange.mock.calls.length;
    await pick(1);
    await settle(fixture);
    expect(entriesChange.mock.calls.length).toBe(calls);
  });

  it('should keep a just typed tag when picking a work', async () => {
    const { user, entriesChange, fixture } = await setup({
      entries: [ENTRIES[1]],
    });
    await user.type(screen.getByRole('textbox', { name: 'tag' }), 'fresh');
    // pick before the tag change is synced (debounced)
    await user.click(
      within(browserRows()[0]).getByRole('button', {
        description: 'Pick this work',
      })
    );
    await settle(fixture, 400);
    expect(entriesChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'c1', tag: 'fresh' }),
      expect.objectContaining({ id: 'w1' }),
    ]);
    expect(
      screen
        .getAllByRole('textbox', { name: 'tag' })
        .map((t) => (t as HTMLInputElement).value)
    ).toEqual(['fresh', '']);
  });

  it('should create a new container from the browser', async () => {
    const { user, biblio, fixture } = await setup();
    await user.click(screen.getAllByRole('checkbox', { name: 'container' })[0]);
    await settle(fixture);
    await user.click(screen.getByRole('button', { name: /new/ }));
    const ed = await editor('(new container)');
    const title = ed.getByRole('textbox', { name: 'title' });
    expect(title).toHaveValue('');
    expect(ed.getByRole('checkbox', { name: 'container' })).toBeChecked();
    await user.click(ed.getByRole('combobox', { name: 'type' }));
    await user.click(await screen.findByRole('option', { name: 'Journal' }));
    await user.type(title, 'New');
    await user.type(ed.getByRole('textbox', { name: 'language' }), 'eng');
    await user.click(
      ed.getByRole('button', { description: 'Accept work changes' })
    );
    expect(biblio.addContainer).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New', isContainer: true })
    );
  });

  it('should edit a work from the browser', async () => {
    const { user, biblio } = await setup();
    await user.click(
      within(browserRows()[0]).getByRole('button', {
        description: 'Edit this work',
      })
    );
    expect(biblio.getWork).toHaveBeenCalledWith('w1');
    const ed = await editor('Alpha');
    expect(ed.getByRole('textbox', { name: 'title' })).toHaveValue('Alpha');
  });

  it('should delete a confirmed work and remove its entry', async () => {
    const { user, biblio, dialog, entriesChange, fixture } = await setup({
      entries: ENTRIES,
    });
    await user.click(
      within(browserRows()[0]).getByRole('button', {
        description: 'Delete this work',
      })
    );
    await settle(fixture);
    expect(dialog.confirm).toHaveBeenCalledWith(
      'Confirmation',
      'Delete work from database?'
    );
    expect(biblio.deleteWork).toHaveBeenCalledWith('w1');
    expect(entriesChange).toHaveBeenLastCalledWith([ENTRIES[1]]);
    expect(labels()).toEqual(['1. Roe - Journal, 1999']);
  });

  it('should delete a confirmed container', async () => {
    const { user, biblio, dialog, fixture } = await setup();
    await user.click(
      within(browserRows()[1]).getByRole('button', {
        description: 'Delete this work',
      })
    );
    await settle(fixture);
    expect(dialog.confirm).toHaveBeenCalledWith(
      'Confirmation',
      'Delete container from database?'
    );
    expect(biblio.deleteContainer).toHaveBeenCalledWith('c2');
  });

  it('should not delete an unconfirmed work', async () => {
    const { user, biblio, entriesChange, fixture } = await setup({
      entries: ENTRIES,
      confirm: false,
    });
    await user.click(
      within(browserRows()[0]).getByRole('button', {
        description: 'Delete this work',
      })
    );
    await settle(fixture);
    expect(biblio.deleteWork).not.toHaveBeenCalled();
    expect(entriesChange).not.toHaveBeenCalled();
  });

  it('should reflect later input changes', async () => {
    const { entriesInput, fixture } = await setup({ entries: ENTRIES });
    entriesInput.set([ENTRIES[1]]);
    await settle(fixture);
    expect(labels()).toEqual(['1. Roe - Journal, 1999']);
  });

  describe('autosave', () => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    it('should not save a normalized copy of the entries it was just given', async () => {
      const { entriesChange } = await setup({
        entries: [{ ...ENTRIES[1], tag: '  untrimmed  ' }],
        roundTrip: true,
      });
      await wait(400); // past the autosave debounce
      expect(entriesChange).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox', { name: 'tag' })).toHaveValue(
        '  untrimmed  '
      );
    });

    it('should keep an in-progress edit when its own save echoes back normalized', async () => {
      const { user, entriesChange, entriesInput } = await setup({
        entries: [ENTRIES[1]],
        roundTrip: true,
      });
      const tag = screen.getByRole('textbox', { name: 'tag' });
      await user.type(tag, 'abc ');
      await wait(400); // past the autosave debounce

      // the entries got the trimmed value, which came back as input...
      expect(entriesChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ id: 'c1', tag: 'abc' }),
      ]);
      expect(entriesInput()[0].tag).toBe('abc');
      // ...but the input still holds what the user typed
      expect(tag).toHaveValue('abc ');
      expect(tag).toHaveFocus();

      // so continuing to type yields "abc d", not "abcd"
      await user.type(tag, 'd');
      expect(tag).toHaveValue('abc d');
      await wait(400);
      expect(entriesChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ id: 'c1', tag: 'abc d' }),
      ]);
    });

    it('should keep a validation error visible after an autosave', async () => {
      const { user } = await setup({
        entries: [{ ...ENTRIES[1], tag: 'x'.repeat(51) }],
        roundTrip: true,
      });
      const note = screen.getByRole('textbox', { name: 'note' });
      await user.click(screen.getByRole('textbox', { name: 'tag' }));
      await user.click(note);
      expect(await screen.findByText('tag too long')).toBeInTheDocument();
      // an edit which gets autosaved and echoed back
      await user.type(note, 'n');
      await wait(400);
      expect(screen.getByText('tag too long')).toBeInTheDocument();
    });

    it('should save entries without the form tags', async () => {
      const { user, entriesChange } = await setup({ entries: ENTRIES });
      await user.type(screen.getAllByRole('textbox', { name: 'note' })[1], 'x');
      await wait(400);
      const saved = entriesChange.mock.lastCall![0] as WorkListEntry[];
      for (const e of saved) {
        expect(Object.getOwnPropertySymbols(e)).toEqual([]);
      }
    });
  });

  it('should render no <form>, so it can be nested at any depth', async () => {
    const { container } = await setup({ entries: ENTRIES });
    expect(container.querySelector('form')).toBeNull();
  });
});
