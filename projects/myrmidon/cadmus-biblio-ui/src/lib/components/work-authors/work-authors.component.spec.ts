import { inputBinding, outputBinding, signal } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';
import { delay, of } from 'rxjs';

import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { Author, WorkAuthor } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { WorkAuthorsComponent } from './work-authors.component';

const AUTHORS: WorkAuthor[] = [
  { id: 'r', first: 'Jane', last: 'Roe', ordinal: 2 },
  { id: 'd', first: 'John', last: 'Doe', role: 'editor', ordinal: 1 },
];

const LOOKUP: Author[] = [{ id: 'x', first: 'Mark', last: 'Smith' }];

/** Let pending async rendering complete. */
async function settle(fixture: ComponentFixture<unknown>) {
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r));
  await fixture.whenStable();
}

async function setup(
  inputs: { authors?: WorkAuthor[]; roleEntries?: ThesaurusEntry[] } = {}
) {
  // async like HTTP
  const getAuthors = vi.fn(() =>
    of({ pageNumber: 1, pageSize: 10, total: 1, items: LOOKUP }).pipe(delay(0))
  );
  const authorsChange = vi.fn();
  const editorClose = vi.fn();
  const authorsInput = signal(inputs.authors);
  const result = await render(WorkAuthorsComponent, {
    bindings: [
      inputBinding('authors', authorsInput),
      inputBinding('roleEntries', () => inputs.roleEntries),
      outputBinding('authorsChange', authorsChange),
      outputBinding('editorClose', editorClose),
    ],
    providers: [{ provide: BiblioService, useValue: { getAuthors } }],
  });
  await settle(result.fixture);
  return {
    ...result,
    authorsInput,
    getAuthors,
    authorsChange,
    editorClose,
    user: userEvent.setup(),
  };
}

function header(): HTMLElement {
  return screen.getByRole('button', { expanded: false });
}

async function expand(user: ReturnType<typeof userEvent.setup>) {
  await user.click(header());
}

function lastNames(): string[] {
  return screen
    .getAllByRole('textbox', { name: 'last' })
    .map((e) => (e as HTMLInputElement).value);
}

function accept(): HTMLButtonElement {
  return screen.getByRole('button', { description: 'Accept authors' });
}

describe('WorkAuthorsComponent', () => {
  it('should show no authors when empty', async () => {
    await setup();
    expect(header()).toHaveTextContent('(no authors)');
    expect(header()).toHaveTextContent('0');
  });

  it('should summarize the bound authors sorted by ordinal', async () => {
    const { user } = await setup({ authors: AUTHORS });
    expect(header()).toHaveTextContent('Doe, John (editor); Roe, Jane');
    expect(header()).toHaveTextContent('2');
    await expand(user);
    expect(lastNames()).toEqual(['Doe', 'Roe']);
    expect(accept()).toBeEnabled();
  });

  it('should update the summary while editing', async () => {
    const { user } = await setup({ authors: AUTHORS });
    await expand(user);
    const first = screen.getAllByRole('textbox', { name: 'first' })[1];
    await user.clear(first);
    await user.type(first, 'Mary');
    expect(
      await screen.findByText('Doe, John (editor); Roe, Mary')
    ).toBeInTheDocument();
  });

  it('should invalidate the form when a loaded author is invalid', async () => {
    const { user } = await setup({ authors: AUTHORS });
    await expand(user);
    const last = screen.getAllByRole('textbox', { name: 'last' })[0];
    await user.clear(last);
    await user.tab();
    expect(accept()).toBeDisabled();
    expect(await screen.findByText('required')).toBeInTheDocument();
  });

  it('should save edited authors with ordinals', async () => {
    const { user, authorsChange } = await setup({ authors: AUTHORS });
    await expand(user);
    const suffix = screen.getAllByRole('textbox', { name: 'suffix' })[1];
    await user.type(suffix, ' jr. ');
    await user.click(accept());
    expect(authorsChange).toHaveBeenLastCalledWith([
      {
        id: 'd',
        first: 'John',
        last: 'Doe',
        suffix: undefined,
        role: 'editor',
        ordinal: 1,
      },
      {
        id: 'r',
        first: 'Jane',
        last: 'Roe',
        suffix: 'jr.',
        role: undefined,
        ordinal: 2,
      },
    ]);
  });

  it('should add a new author', async () => {
    const { user, authorsChange } = await setup({ authors: [AUTHORS[1]] });
    await expand(user);
    await user.click(
      screen.getByRole('button', { description: 'Add a new author' })
    );
    expect(lastNames()).toEqual(['Doe', '']);
    expect(accept()).toBeDisabled();

    await user.type(screen.getAllByRole('textbox', { name: 'last' })[1], 'New');
    await user.type(
      screen.getAllByRole('textbox', { name: 'first' })[1],
      'Ann'
    );
    await user.click(accept());
    expect(authorsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'd', ordinal: 1 }),
      expect.objectContaining({ id: null, last: 'New', first: 'Ann', ordinal: 2 }),
    ]);
  });

  it('should remove an author', async () => {
    const { user, authorsChange } = await setup({ authors: AUTHORS });
    await expand(user);
    await user.click(
      screen.getAllByRole('button', { description: 'Remove this author' })[0]
    );
    expect(lastNames()).toEqual(['Roe']);
    await user.click(accept());
    expect(authorsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'r', ordinal: 1 }),
    ]);
  });

  it('should not accept an empty authors list', async () => {
    const { user } = await setup({ authors: [AUTHORS[0]] });
    await expand(user);
    await user.click(
      screen.getByRole('button', { description: 'Remove this author' })
    );
    // count is updated after debounce
    await vi.waitFor(() => expect(accept()).toBeDisabled());
  });

  it('should move authors up and down', async () => {
    const { user, authorsChange } = await setup({
      authors: [...AUTHORS, { id: 'z', first: 'Z', last: 'Zed', ordinal: 3 }],
    });
    await expand(user);

    const up = () =>
      screen.getAllByRole('button', { description: 'Move author up' });
    const down = () =>
      screen.getAllByRole('button', { description: 'Move author down' });
    expect(up()[0]).toBeDisabled();
    expect(down()[2]).toBeDisabled();

    await user.click(up()[2]);
    expect(lastNames()).toEqual(['Doe', 'Zed', 'Roe']);
    await user.click(down()[0]);
    expect(lastNames()).toEqual(['Zed', 'Doe', 'Roe']);

    await user.click(accept());
    expect(
      authorsChange.mock.lastCall![0].map((a: WorkAuthor) => [a.id, a.ordinal])
    ).toEqual([
      ['z', 1],
      ['d', 2],
      ['r', 3],
    ]);
  });

  it('should discard changes on cancel', async () => {
    const { user, authorsChange, editorClose } = await setup({
      authors: AUTHORS,
    });
    await expand(user);
    await user.click(
      screen.getAllByRole('button', { description: 'Remove this author' })[0]
    );
    await user.click(
      screen.getByRole('button', { description: 'Discard authors' })
    );
    expect(editorClose).toHaveBeenCalled();
    expect(authorsChange).not.toHaveBeenCalled();
    // collapsed with the original authors
    expect(header()).toHaveTextContent('Doe, John (editor); Roe, Jane');
    await expand(user);
    expect(lastNames()).toEqual(['Doe', 'Roe']);
  });

  it('should add an author picked from lookup only once', async () => {
    const { user, getAuthors } = await setup({ authors: [AUTHORS[1]] });
    await expand(user);

    const pick = async () => {
      await user.click(screen.getByRole('button', { name: 'author' }));
      await user.type(screen.getByPlaceholderText('author'), 'smi');
      await user.click(
        await screen.findByRole('option', { name: 'Smith, Mark' })
      );
    };
    await pick();
    expect(getAuthors).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 10,
      last: 'smi',
    });
    expect(lastNames()).toEqual(['Doe', 'Smith']);

    // picking the same author again is ignored
    await screen.findByRole('button', { name: 'author' });
    await pick();
    expect(lastNames()).toEqual(['Doe', 'Smith']);
  });

  it('should reflect a later empty input', async () => {
    const { user, authorsInput, fixture } = await setup({ authors: AUTHORS });
    authorsInput.set([]);
    await settle(fixture);
    expect(header()).toHaveTextContent('(no authors)');
    await expand(user);
    expect(screen.queryAllByRole('textbox', { name: 'last' })).toHaveLength(0);
  });

  it('should use a role select with role entries', async () => {
    const { user, authorsChange } = await setup({
      authors: [AUTHORS[0]],
      roleEntries: [
        { id: '-', value: '-' },
        { id: 'tr', value: 'translator' },
      ],
    });
    await expand(user);
    expect(
      screen.queryByRole('textbox', { name: 'role' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'role' }));
    await user.click(await screen.findByRole('option', { name: 'translator' }));
    await user.click(accept());
    expect(authorsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'r', role: 'tr' }),
    ]);
  });
});
