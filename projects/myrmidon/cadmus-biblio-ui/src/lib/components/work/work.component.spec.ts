import { inputBinding, outputBinding, signal } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { render, screen, within } from '@testing-library/angular/zoneless';
import userEvent from '@testing-library/user-event';
import { delay, Observable, of } from 'rxjs';

import { BiblioService } from '@myrmidon/cadmus-biblio-api';
import { Container, EditedWork } from '@myrmidon/cadmus-biblio-core';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { HistoricalDate } from '@myrmidon/cadmus-refs-historical-date';

import { WorkComponent } from './work.component';

const CONTAINER: Container = {
  id: 'c1',
  key: 'J 1999',
  type: 'journal',
  title: 'Journal',
  language: 'eng',
  yearPub: 1999,
};

const WORK: EditedWork = {
  id: 'w1',
  key: '!Manual',
  type: 'article',
  title: 'The Alpha',
  language: 'eng',
  authors: [{ id: 'a1', first: 'John', last: 'Doe', ordinal: 1 }],
  placePub: 'Rome',
  yearPub: 2000,
  yearPub2: 2001,
  publisher: 'ACME',
  container: CONTAINER,
  firstPage: 10,
  lastPage: 20,
  number: '3',
  note: 'A note',
  datation: '1200 AD',
  location: 'http://acme.org',
  keywords: [{ language: 'eng', value: 'test' }],
  links: [{ sourceId: '', scope: 'doi', value: '10.1/a' }],
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
  inputs: { work?: EditedWork; langEntries?: ThesaurusEntry[] } = {}
) {
  const biblio = {
    getWorkTypes: vi.fn(() =>
      later({
        pageNumber: 1,
        pageSize: 0,
        total: 3,
        items: [
          { id: 'article', name: 'Article' },
          { id: 'book', name: 'Book' },
          { id: 'journal', name: 'Journal' },
        ],
      })
    ),
    getContainers: vi.fn(() =>
      later({ pageNumber: 1, pageSize: 10, total: 1, items: [CONTAINER] })
    ),
  };
  const workChange = vi.fn();
  const editorClose = vi.fn();
  const workInput = signal(inputs.work);
  const result = await render(WorkComponent, {
    bindings: [
      inputBinding('work', workInput),
      inputBinding('langEntries', () => inputs.langEntries),
      outputBinding('workChange', workChange),
      outputBinding('editorClose', editorClose),
    ],
    providers: [
      { provide: BiblioService, useValue: biblio },
      provideNativeDateAdapter(),
    ],
  });
  await settle(result.fixture);
  return {
    ...result,
    biblio,
    workInput,
    workChange,
    editorClose,
    user: userEvent.setup(),
  };
}

function textbox(name: string): HTMLInputElement {
  return screen.getByRole('textbox', { name }) as HTMLInputElement;
}

function spin(name: string): HTMLInputElement {
  return screen.getByRole('spinbutton', { name }) as HTMLInputElement;
}

function accept(): HTMLButtonElement {
  return screen.getByRole('button', { description: 'Accept work changes' });
}

describe('WorkComponent', () => {
  it('should render an empty new work which cannot be saved', async () => {
    const { biblio } = await setup();
    expect(biblio.getWorkTypes).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 0,
    });
    expect(textbox('title')).toHaveValue('');
    expect(accept()).toBeDisabled();
  });

  it('should show the loaded work', async () => {
    await setup({ work: WORK });
    expect(screen.getByRole('combobox', { name: 'type' })).toHaveTextContent(
      'Article'
    );
    expect(screen.getByRole('checkbox', { name: 'container' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'user key' })).toBeChecked();
    expect(textbox('key')).toHaveValue('Manual');
    expect(textbox('title')).toHaveValue('The Alpha');
    expect(textbox('language')).toHaveValue('eng');
    expect(textbox('place')).toHaveValue('Rome');
    expect(spin('year')).toHaveValue(2000);
    expect(spin('year2')).toHaveValue(2001);
    expect(textbox('publisher')).toHaveValue('ACME');
    expect(spin('from')).toHaveValue(10);
    expect(spin('to')).toHaveValue(20);
    expect(textbox('number')).toHaveValue('3');
    expect(textbox('note')).toHaveValue('A note');
    expect(textbox('location')).toHaveValue('http://acme.org');
    expect(screen.getByRole('checkbox', { name: 'has datation' })).toBeChecked();
    // child editors got their data
    expect(screen.getByText('Doe, John')).toBeInTheDocument();
    expect(screen.getByText('10.1/a')).toBeInTheDocument();
    // the container lookup shows the container
    expect(
      screen.getByRole('button', { name: 'Journal, 1999'.replace(/^/, ' - ').trim() })
    ).toBeInTheDocument();
    // pristine
    expect(accept()).toBeDisabled();
  });

  it('should save the edited work', async () => {
    const { user, workChange } = await setup({ work: WORK });
    const title = textbox('title');
    await user.clear(title);
    await user.type(title, '  The Beta  ');
    await user.click(accept());

    const datation = new HistoricalDate(HistoricalDate.parse('1200 AD')!);
    expect(workChange).toHaveBeenCalledWith({
      isContainer: false,
      id: 'w1',
      type: 'article',
      key: '!Manual',
      authors: WORK.authors,
      title: 'The Beta',
      language: 'eng',
      placePub: 'Rome',
      yearPub: 2000,
      yearPub2: 2001,
      publisher: 'ACME',
      container: CONTAINER,
      firstPage: 10,
      lastPage: 20,
      number: '3',
      note: 'A note',
      datation: datation.toString(),
      datationValue: datation.getSortValue(),
      location: 'http://acme.org',
      accessDate: undefined,
      keywords: WORK.keywords,
      links: WORK.links,
    });
  });

  it('should create a new work', async () => {
    const { user, workChange } = await setup();
    await user.click(screen.getByRole('combobox', { name: 'type' }));
    await user.click(await screen.findByRole('option', { name: 'Book' }));
    await user.type(textbox('title'), 'New');
    await user.type(textbox('language'), 'ita');
    await user.click(accept());
    expect(workChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isContainer: false,
        id: undefined,
        type: 'book',
        key: '',
        title: 'New',
        language: 'ita',
        authors: undefined,
        keywords: undefined,
        links: undefined,
        container: undefined,
        datation: undefined,
      })
    );
  });

  it('should save a container without container and pages', async () => {
    const { user, workChange } = await setup({ work: WORK });
    await user.click(screen.getByRole('checkbox', { name: 'container' }));
    expect(screen.queryByRole('spinbutton', { name: 'from' })).not.toBeInTheDocument();
    await user.click(accept());
    expect(workChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isContainer: true,
        container: undefined,
        firstPage: undefined,
        lastPage: undefined,
      })
    );
  });

  it('should save a non-user key without prefix', async () => {
    const { user, workChange } = await setup({ work: WORK });
    await user.click(screen.getByRole('checkbox', { name: 'user key' }));
    await user.click(accept());
    expect(workChange).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'Manual' })
    );
  });

  it('should build the key', async () => {
    const { user } = await setup({ work: WORK });
    await user.click(screen.getByRole('button', { description: 'Build key' }));
    expect(textbox('key')).toHaveValue('Doe 2000');
    expect(accept()).toBeEnabled();
  });

  it('should set the last page from the first page', async () => {
    const { user } = await setup({ work: { ...WORK, firstPage: 0, lastPage: 0 } });
    const from = spin('from');
    await user.clear(from);
    await user.type(from, '15');
    expect(spin('to')).toHaveValue(15);
  });

  it('should enable the access date only when requested', async () => {
    const { user } = await setup({ work: WORK });
    const date = textbox('access date');
    expect(date).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'access date' }));
    expect(date).toBeEnabled();
  });

  it('should load and save an access date', async () => {
    const accessDate = new Date(2024, 0, 15);
    const { user, workChange } = await setup({ work: { ...WORK, accessDate } });
    expect(screen.getByRole('checkbox', { name: 'access date' })).toBeChecked();
    expect(textbox('access date')).toBeEnabled();
    await user.type(textbox('note'), '!');
    await user.click(accept());
    expect(workChange).toHaveBeenCalledWith(
      expect.objectContaining({ accessDate })
    );
  });

  it('should drop the datation when unchecked', async () => {
    const { user, workChange } = await setup({ work: WORK });
    await user.click(screen.getByRole('checkbox', { name: 'has datation' }));
    await user.click(accept());
    expect(workChange).toHaveBeenCalledWith(
      expect.objectContaining({ datation: undefined, datationValue: undefined })
    );
  });

  it('should pick and remove the container', async () => {
    const { user, workChange, biblio } = await setup({
      work: { ...WORK, container: undefined },
    });
    await user.click(screen.getByRole('button', { name: 'container' }));
    await user.type(screen.getByPlaceholderText('container'), 'jo');
    await user.click(
      await screen.findByRole('option', { name: '- Journal, 1999' })
    );
    expect(biblio.getContainers).toHaveBeenCalled();
    await user.click(accept());
    expect(workChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ container: CONTAINER })
    );

    await user.click(
      screen.getByRole('button', {
        description: "Remove the work's container",
      })
    );
    await user.click(accept());
    expect(workChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ container: undefined })
    );
  });

  it('should accept child editors changes without saving the work', async () => {
    const { user, workChange } = await setup({ work: WORK });
    // edit an author in the authors editor
    await user.click(screen.getByRole('button', { name: /Doe, John/ }));
    const first = screen.getByRole('textbox', { name: 'first' });
    await user.clear(first);
    await user.type(first, 'Jack');
    await user.click(screen.getByRole('button', { description: 'Accept authors' }));
    expect(workChange).not.toHaveBeenCalled();

    // the work is now dirty and saves the new authors
    await user.click(accept());
    expect(workChange).toHaveBeenCalledWith(
      expect.objectContaining({
        authors: [expect.objectContaining({ id: 'a1', first: 'Jack' })],
      })
    );
  });

  it('should accept a new link without saving the work', async () => {
    const { user, workChange } = await setup({ work: WORK });
    const links = screen.getByRole('group', { name: 'links' });
    await user.click(within(links).getByRole('button', { name: /ID/ }));
    await user.type(within(links).getByRole('textbox', { name: 'scope' }), 'isbn');
    await user.type(within(links).getByRole('textbox', { name: 'value' }), '978');
    await user.click(
      within(links).getByRole('button', { description: 'Accept changes' })
    );
    expect(workChange).not.toHaveBeenCalled();
    await user.click(accept());
    expect(workChange).toHaveBeenCalledWith(
      expect.objectContaining({
        links: [
          WORK.links![0],
          { sourceId: '', scope: 'isbn', value: '978' },
        ],
      })
    );
  });

  it('should emit close on cancel', async () => {
    const { user, editorClose, workChange } = await setup({ work: WORK });
    await user.click(
      screen.getByRole('button', { description: 'Discard work changes' })
    );
    expect(editorClose).toHaveBeenCalled();
    expect(workChange).not.toHaveBeenCalled();
  });

  it('should reload when the work input changes', async () => {
    const { workInput, fixture } = await setup({ work: WORK });
    workInput.set({
      key: 'Roe 1990',
      type: 'book',
      title: 'Other',
      language: 'ita',
      isContainer: true,
    });
    await settle(fixture);
    expect(textbox('title')).toHaveValue('Other');
    expect(textbox('key')).toHaveValue('Roe 1990');
    expect(screen.getByRole('checkbox', { name: 'user key' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'container' })).toBeChecked();
    expect(screen.queryByText('Doe, John')).not.toBeInTheDocument();
    workInput.set(undefined);
    await settle(fixture);
    expect(textbox('title')).toHaveValue('');
  });

  it('should use a language select with language entries', async () => {
    const { user, workChange } = await setup({
      work: WORK,
      langEntries: [
        { id: 'eng', value: 'English' },
        { id: 'ita', value: 'Italian' },
      ],
    });
    const select = screen.getByRole('combobox', { name: 'language' });
    expect(select).toHaveTextContent('English');
    await user.click(select);
    await user.click(await screen.findByRole('option', { name: 'Italian' }));
    await user.click(accept());
    expect(workChange).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'ita' })
    );
  });

  it('should render no <form>, so it can be nested at any depth', async () => {
    const { container } = await setup({ work: WORK });
    expect(container.querySelector('form')).toBeNull();
  });

  it('should be pristine after loading a work', async () => {
    await setup({ work: WORK });
    // wait past the child editors' autosave debounce (historical date)
    await new Promise((r) => setTimeout(r, 600));
    expect(accept()).toBeDisabled();
  });

  it('should save on Enter in a text input when changed', async () => {
    const { user, workChange } = await setup({ work: WORK });
    await user.type(textbox('number'), '{Enter}');
    expect(workChange).not.toHaveBeenCalled();
    await user.type(textbox('number'), 'a{Enter}');
    expect(workChange).toHaveBeenCalledWith(
      expect.objectContaining({ number: '3a' })
    );
  });

  it('should only accept the authors on Enter in an author input', async () => {
    const { user, workChange } = await setup({ work: WORK });
    // make the work savable
    await user.type(textbox('number'), 'a');
    await user.click(screen.getByRole('button', { name: /Doe, John/ }));
    await user.type(screen.getByRole('textbox', { name: 'first' }), 'x{Enter}');
    // the authors editor closed, and the work was not saved
    expect(screen.getByRole('button', { name: /Doe, Johnx/ })).toBeInTheDocument();
    expect(workChange).not.toHaveBeenCalled();
    await user.click(accept());
    expect(workChange).toHaveBeenCalledWith(
      expect.objectContaining({
        authors: [expect.objectContaining({ first: 'Johnx' })],
      })
    );
  });

  it('should not save on Enter in the container lookup', async () => {
    const { user, workChange } = await setup({
      work: { ...WORK, container: undefined },
    });
    await user.type(textbox('number'), 'a');
    await user.click(screen.getByRole('button', { name: 'container' }));
    await user.type(screen.getByPlaceholderText('container'), 'jo{Enter}');
    expect(workChange).not.toHaveBeenCalled();
  });

  it('should save arrays without the form tags', async () => {
    const { user, workChange } = await setup({ work: WORK });
    await user.type(textbox('number'), 'a');
    await user.click(accept());
    const work = workChange.mock.lastCall![0];
    for (const item of [...work.authors, ...work.keywords, ...work.links]) {
      expect(Object.getOwnPropertySymbols(item)).toEqual([]);
    }
  });
});
