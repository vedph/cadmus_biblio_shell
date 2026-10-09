import { inputBinding, outputBinding } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';
import { delay, Observable, of } from 'rxjs';

import { BiblioService, WorkFilter } from '@myrmidon/cadmus-biblio-api';
import { Author, Container } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { LocalStorageService } from '@myrmidon/ngx-tools';

import { WorkFilterComponent } from './work-filter.component';

const AUTHOR: Author = { id: 'a1', first: 'John', last: 'Doe' };
const CONTAINER: Container = {
  id: 'c1',
  key: 'J',
  type: 'journal',
  title: 'Journal',
  language: 'eng',
};
const EMPTY = { pageNumber: 1, pageSize: 10 };
const KEY = 'cadmus-biblio-ui.work-filter';

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
  inputs: { persisted?: boolean; langEntries?: ThesaurusEntry[] } = {},
  stored: WorkFilter | null = null
) {
  const biblio = {
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
    getAuthor: vi.fn(() => later(AUTHOR)),
    getContainer: vi.fn(() => later(CONTAINER)),
    getAuthors: vi.fn(() =>
      later({ pageNumber: 1, pageSize: 10, total: 1, items: [AUTHOR] })
    ),
    getContainers: vi.fn(() =>
      later({ pageNumber: 1, pageSize: 10, total: 1, items: [CONTAINER] })
    ),
  };
  const storage = {
    retrieve: vi.fn(() => stored),
    store: vi.fn(),
  };
  const filterChange = vi.fn();
  const result = await render(WorkFilterComponent, {
    bindings: [
      ...Object.entries(inputs).map(([k, v]) => inputBinding(k, () => v)),
      outputBinding('filterChange', filterChange),
    ],
    providers: [
      { provide: BiblioService, useValue: biblio },
      { provide: LocalStorageService, useValue: storage },
    ],
  });
  await settle(result.fixture);
  return { ...result, biblio, storage, filterChange, user: userEvent.setup() };
}

function apply(): HTMLButtonElement {
  return screen.getByRole('button', { description: 'Apply filters' });
}

describe('WorkFilterComponent', () => {
  it('should render empty filters with loaded work types', async () => {
    const { user, biblio, storage } = await setup();
    expect(biblio.getWorkTypes).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 0,
    });
    expect(storage.retrieve).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'match any' })).not.toBeChecked();
    expect(screen.getByRole('textbox', { name: 'language' })).toHaveValue('');
    expect(screen.getByRole('spinbutton', { name: 'yr.min.' })).toHaveValue(0);

    await user.click(screen.getByRole('combobox', { name: 'type' }));
    expect(
      (await screen.findAllByRole('option')).map((o) => o.textContent?.trim())
    ).toEqual(['(any)', 'Book', 'Journal']);
  });

  it('should apply all the filters', async () => {
    const { user, filterChange, storage } = await setup();
    await user.click(screen.getByRole('checkbox', { name: 'match any' }));
    await user.click(screen.getByRole('combobox', { name: 'type' }));
    await user.click(await screen.findByRole('option', { name: 'Book' }));
    await user.type(screen.getByRole('textbox', { name: 'language' }), 'eng');
    await user.type(screen.getByRole('textbox', { name: 'last name' }), 'doe');
    await user.type(screen.getByRole('textbox', { name: 'title' }), 'alpha');
    const yrMin = screen.getByRole('spinbutton', { name: 'yr.min.' });
    await user.clear(yrMin);
    await user.type(yrMin, '1900');
    const yrMax = screen.getByRole('spinbutton', { name: 'yr.max.' });
    await user.clear(yrMax);
    await user.type(yrMax, '2000');
    await user.type(screen.getByRole('textbox', { name: 'key' }), 'k');
    await user.type(screen.getByRole('textbox', { name: 'keyword' }), 'eng:x');
    await user.click(apply());

    const expected: WorkFilter = {
      pageNumber: 1,
      pageSize: 10,
      matchAny: true,
      type: 'book',
      authorId: undefined,
      lastName: 'doe',
      language: 'eng',
      title: 'alpha',
      yearPubMin: 1900,
      yearPubMax: 2000,
      key: 'k',
      keyword: 'eng:x',
      containerId: undefined,
    };
    expect(filterChange).toHaveBeenCalledWith(expected);
    expect(storage.store).toHaveBeenCalledWith(KEY, expected, true);
  });

  it('should filter by author and container picked from lookups', async () => {
    const { user, filterChange, biblio } = await setup();

    await user.click(screen.getByRole('button', { name: 'author' }));
    await user.type(screen.getByPlaceholderText('author'), 'do');
    await user.click(await screen.findByRole('option', { name: 'Doe, John' }));
    expect(biblio.getAuthors).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 10,
      last: 'do',
    });

    await user.click(screen.getByRole('button', { name: 'container' }));
    await user.type(screen.getByPlaceholderText('container'), 'jo');
    await user.click(
      await screen.findByRole('option', { name: '- Journal' })
    );
    expect(biblio.getContainers).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'jo', lastName: 'jo', matchAny: true })
    );

    await user.click(apply());
    expect(filterChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ authorId: 'a1', containerId: 'c1' })
    );
  });

  it('should remove author and container filters', async () => {
    const { user, filterChange } = await setup(
      { persisted: true },
      { ...EMPTY, authorId: 'a1', containerId: 'c1' }
    );
    await user.click(
      screen.getByRole('button', { description: 'Remove author filter' })
    );
    await user.click(
      screen.getByRole('button', { description: 'Remove container filter' })
    );
    expect(
      screen.queryByRole('button', { description: 'Remove author filter' })
    ).not.toBeInTheDocument();
    await user.click(apply());
    expect(filterChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ authorId: undefined, containerId: undefined })
    );
  });

  it('should restore a persisted filter', async () => {
    const stored = {
      ...EMPTY,
      matchAny: true,
      type: 'journal',
      authorId: 'a1',
      containerId: 'c1',
      title: 'alpha',
      yearPubMin: 1950,
    };
    const { biblio, storage, filterChange } = await setup(
      { persisted: true },
      {
        ...EMPTY,
        matchAny: true,
        type: 'journal',
        authorId: 'a1',
        containerId: 'c1',
        title: 'alpha',
        yearPubMin: 1950,
      }
    );
    expect(storage.retrieve).toHaveBeenCalledWith(KEY, true);
    // the restored filter is applied
    expect(filterChange).toHaveBeenCalledWith(stored);
    expect(biblio.getAuthor).toHaveBeenCalledWith('a1');
    expect(biblio.getContainer).toHaveBeenCalledWith('c1');
    expect(screen.getByRole('checkbox', { name: 'match any' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'type' })).toHaveTextContent(
      'Journal'
    );
    expect(screen.getByRole('textbox', { name: 'title' })).toHaveValue('alpha');
    expect(screen.getByRole('spinbutton', { name: 'yr.min.' })).toHaveValue(
      1950
    );
    // the lookups show the restored author and container
    expect(screen.getByRole('button', { name: 'Doe, John' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '- Journal' })).toBeInTheDocument();
  });

  it('should reset all the filters, including author', async () => {
    const { user, filterChange, storage } = await setup(
      { persisted: true },
      { ...EMPTY, authorId: 'a1', containerId: 'c1', title: 'alpha' }
    );
    await user.click(
      screen.getByRole('button', { description: 'Reset all filters' })
    );
    expect(filterChange).toHaveBeenCalledWith(EMPTY);
    expect(storage.store).toHaveBeenCalledWith(KEY, EMPTY, true);
    expect(screen.getByRole('textbox', { name: 'title' })).toHaveValue('');
    expect(
      screen.queryByRole('button', { description: 'Remove author filter' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { description: 'Remove container filter' })
    ).not.toBeInTheDocument();
    // the lookups no longer show the removed author and container
    expect(screen.getByRole('button', { name: 'author' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'container' })).toBeInTheDocument();

    await user.click(apply());
    expect(filterChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ authorId: undefined, containerId: undefined })
    );
  });

  it('should use a language select with language entries', async () => {
    const { user, filterChange } = await setup({
      langEntries: [
        { id: 'eng', value: 'English' },
        { id: 'ita', value: 'Italian' },
      ],
    });
    expect(
      screen.queryByRole('textbox', { name: 'language' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'language' }));
    await user.click(await screen.findByRole('option', { name: 'Italian' }));
    await user.click(apply());
    expect(filterChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ language: 'ita' })
    );
  });

  it('should apply on Enter without bubbling submit to a parent form', async () => {
    const parentSubmit = vi.fn();
    const { user, filterChange, container } = await setup();
    container.parentElement!.addEventListener('submit', parentSubmit);
    await user.type(screen.getByRole('textbox', { name: 'title' }), 'x{Enter}');
    expect(filterChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'x' })
    );
    expect(parentSubmit).not.toHaveBeenCalled();
  });
});
